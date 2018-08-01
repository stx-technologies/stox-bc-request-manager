/* eslint-disable no-unused-expressions */
const uuid4 = require('uuid4')
const {initContext, context, createService, models} = require('../../index')
const requests = require('../../services/requests')
const {databaseUrl, network} = require('../test_config')

describe('requests service sanity checks', () => {
  beforeAll(async (done) => {
    const builderFunc = builder => builder.db(databaseUrl, models)
    const ctx = await createService('request-handler-tests', builderFunc)
    initContext({...ctx}, context)
    done()
  })

  it('should add given request to db with createdAt field', async () => {
    // prepare
    const requestToAdd = {id: uuid4(), type: 'createWallet', data: {}}

    // act
    await requests.createRequest(requestToAdd)
    const {dataValues: updatedRequest} = await context.db.requests.findOne({where: {id: requestToAdd.id}})

    // assert
    expect(updatedRequest).to.shallowDeepEqual(requestToAdd)
    expect(updatedRequest.createdAt).to.exist
  })

  it('should add error field with completedAtField', async () => {
    // prepare
    const requestToAdd = {id: uuid4(), type: 'createWallet', data: {}}
    await context.db.requests.create(requestToAdd)
    const error = {message: 'test'}

    // act
    await requests.updateRequestCompleted(requestToAdd.id, error)
    const {dataValues: updatedRequest} = await context.db.requests.findOne({where: {id: requestToAdd.id}})

    // assert
    expect(updatedRequest).to.shallowDeepEqual(requestToAdd)
    expect(updatedRequest.error).eql(error)
    expect(updatedRequest.completedAt).to.exist
  })

  it('should return the count of request by type, with pending ot not pending', async () => {
    // prepare
    const type = 'createWallet'
    const requestsToAdd = [
      {id: uuid4(), type, data: {}},
      {id: uuid4(), type: 'sendPrize', data: {}},
      {id: uuid4(), type, data: {}, transactionPreparedAt: new Date()},
      {id: uuid4(), type, data: {}, error: {message: 'test'}},
    ]
    await context.db.requests.bulkCreate(requestsToAdd)

    // act
    const {count: countOfAllRequests} = await requests.countRequestByType(type)
    const {count: countOfPendingRequests} = await requests.countPendingRequestByType(type)

    // assert
    expect(countOfAllRequests).eql(3)
    expect(countOfPendingRequests).eql(1)
  })

  it('should return the request by transaction id corresponding to him', async () => {
    // prepare
    const requestToAdd = {id: uuid4(), type: 'createWallet', data: {}}
    const transaction = {id: uuid4(), requestId: requestToAdd.id, type: 'send', from: 'from', network}
    await context.db.requests.create(requestToAdd)
    await context.db.transactions.create(transaction)

    // act
    const updatedRequest = await requests.getRequestByTransactionId(transaction.id)

    // assert
    expect(updatedRequest).to.shallowDeepEqual(requestToAdd)
  })

  it('should return all pending requests by limit', async () => {
    const type = 'createWallet'
    const requestsToAdd = [{id: uuid4(), type, data: {}}, {id: uuid4(), type, data: {}}, {id: uuid4(), type, data: {}}]
    const transactionsToAdd = [
      {id: uuid4(), requestId: requestsToAdd[0].id, type: 'send', from: 'from', network},
      {id: uuid4(), requestId: requestsToAdd[1].id, type: 'send', from: 'from', network},
    ]
    await context.db.requests.bulkCreate(requestsToAdd)
    await context.db.transactions.bulkCreate(transactionsToAdd)

    // act
    const correspendingRequests = await requests.getCorrespondingRequests(transactionsToAdd)

    // assert
    expect(correspendingRequests).to.have.length(2)
  })

  it('should return all corresponding request to of given transaction', async () => {
    const type = 'createWallet'
    const requestsToAdd = [
      {id: uuid4(), type, data: {}},
      {id: uuid4(), type, data: {}},
      {id: uuid4(), type, data: {}},
      {id: uuid4(), type, data: {}, transactionPreparedAt: new Date()},
      {id: uuid4(), type, data: {}, error: {message: 'test'}},
    ]
    await context.db.requests.bulkCreate(requestsToAdd)

    // act
    const allPendingRequests = await requests.getPendingRequests(6)
    const limitedPendingRequest = await requests.getPendingRequests(2)

    // assert
    expect(allPendingRequests).to.have.length(3)
    expect(limitedPendingRequest).to.have.length(2)
  })

  afterEach(async (done) => {
    await context.db.requests.destroy({where: {}})
    await context.db.transactions.destroy({where: {}})
    done()
  })

  afterAll(async (done) => {
    await context.db.sequelize.close()
    done()
  })
})

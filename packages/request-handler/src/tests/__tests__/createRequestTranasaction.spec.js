const {
  provider,
  interactions,
  createInteraction,
  createFailedInteraction,
} = require('../pacts/walletsApi')
const uuid4 = require('uuid4')
const {initContext, context, createService, models} = require('stox-bc-request-manager-common')
const {createRequestTransactions} = require('../../services/requestHandler')
const config = require('../../config')

const {databaseUrl} = config

describe('request-handler integration with database', () => {
  beforeAll(async (done) => {
    const ctx = await createService(uuid4(), builder => builder.db(databaseUrl, models))
    initContext({...ctx, config}, context)
    await provider.setup()
    done()
  })

  afterEach(async (done) => {
    await context.db.transactions.destroy({where: {}})
    await context.db.requests.destroy({where: {}})
    await context.db.accountNonces.destroy({where: {}})
    await provider.verify()
    done()
  })

  afterAll(async (done) => {
    await provider.finalize()
    done()
  })

  interactions.forEach((interaction) => {
    const {type} = interaction

    it(`should create '${type}' transactions and update the request with transactionPreparedAt value`, async (done) => {
      // prepare
      const request = {id: uuid4(), type, data: interaction.data}
      await createInteraction(interaction)
      await context.db.requests.create(request)

      // act
      await createRequestTransactions(request)

      // assert
      const {dataValues: updatedRequest} = await context.db.requests.findOne({where: {id: request.id}})
      const {dataValues: transaction} = await context.db.transactions.findOne({where: {requestId: request.id}})
      const numberOfCreatedTransactions = await context.db.transactions.count({where: {requestId: request.id}})
      expect(numberOfCreatedTransactions).toBe(1)
      expect(updatedRequest.transactionPreparedAt).toBeTruthy()
      expect(updatedRequest.error).toBeFalsy()
      expect(updatedRequest.completedAt).toBeFalsy()
      expect(transaction.error).toBeFalsy()
      expect(transaction.completedAt).toBeFalsy()
      expect(transaction.createdAt).toBeTruthy()
      done()
    })

    it('should not create transactions and fail the request with the error and competedAt values', async (done) => {
      // prepare
      const request = {id: uuid4(), type, data: interaction.data}
      await createFailedInteraction(interaction)
      await context.db.requests.create(request)

      // act
      try {
        await createRequestTransactions(request)
      } catch (e) {
      }

      // assert
      const {dataValues: updatedRequest} = await context.db.requests.findOne({where: {id: request.id}})
      const numberOfCreatedTransactions = await context.db.transactions.count({where: {requestId: request.id}})
      expect(numberOfCreatedTransactions).toBe(0)
      expect(updatedRequest.transactionPreparedAt).toBeFalsy()
      expect(updatedRequest.error).toBeTruthy()
      expect(updatedRequest.completedAt).toBeTruthy()
      done()
    })
  })
})

const {join, resolve} = require('path')
require('app-module-path').addPath(join(__dirname, '../src'))
const {initContext, context, createService, models} = require('stox-bc-request-manager-common')
const uuid = require('uuid4')
const config = require('../src/config')
const requireAll = require('require-all')

const {handlePendingRequests} = requireAll(resolve(__dirname, '../src/jobs'))

const types = ['sendPrize', 'withdraw', 'setWithdrawalAddress', 'sendToBackup', 'createWallet']
const {databaseUrl, mqConnectionUrl} = config

describe('request-handler', () => {
  const requestToAdd = {
    id: uuid(),
    type: types[0],
    data: {},
  }

  beforeEach(() => {
    jest.resetModules();
  })

  beforeAll(async () => {
    const builderFunc = (builder) => {
      builder.db(databaseUrl, models)
      builder.addQueues(mqConnectionUrl)
    }
    const ctx = await createService('request-handler-tests', builderFunc)
    initContext({...ctx, config}, context)
    context.logger = ctx.logger
  })

  afterAll(async () => {
    await context.db.transactions.destroy({where: {}})
    await context.db.requests.destroy({where: {}})
    await context.db.accountNonces.destroy({where: {}})
  })

  it('run test', async () => {
    // jest.doMock('plugins', () => {
    //   return {
    //     sendPrize: async (request) => {
    //       const {id, tokenAddress} = request
    //       return [
    //         {
    //           requestId: id,
    //           type: 'send',
    //           to: tokenAddress,
    //         },
    //       ]
    //     },
    //   }
    // })
    await context.db.requests.create(requestToAdd)
    await handlePendingRequests.job()
    const {dataValues: request} = await context.db.requests.findOne({where: {id: requestToAdd.id}})
    const transaction = await context.db.transactions.findOne({where: {requestId: requestToAdd.id}})
    expect(request.sentAt).toBeTruthy()
    expect(transaction).toBeTruthy()
  })
})

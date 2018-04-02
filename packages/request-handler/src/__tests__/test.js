const {resolve} = require('path')
const {initContext, context, createService, models} = require('stox-bc-request-manager-common')
const uuid = require('uuid4')
const config = require('../config')
const requireAll = require('require-all')

const {handlePendingRequests} = requireAll(resolve(__dirname, '../jobs'))

const types = ['sendPrize', 'withdraw', 'setWithdrawalAddress', 'sendToBackup', 'createWallet']
const {databaseUrl, mqConnectionUrl, network} = config

jest.mock('plugins')
const plugins = require('plugins')

describe('request-handler', () => {
  const requestToAdd = {
    id: uuid(),
    type: types[0],
    data: {},
  }

  beforeEach(() => {
    jest.resetModules()
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
    plugins.sendPrize.prepareTransactions = jest.fn().mockImplementationOnce(async ({id}) => [
      {
        requestId: id,
        type: 'send',
        network,
      },
    ])
    await context.db.requests.create(requestToAdd)
    await handlePendingRequests.job()
    const {dataValues: request} = await context.db.requests.findOne({where: {id: requestToAdd.id}})
    const transaction = await context.db.transactions.findOne({where: {requestId: requestToAdd.id}})
    expect(request.sentAt).toBeTruthy()
    expect(transaction).toBeTruthy()
  })
})

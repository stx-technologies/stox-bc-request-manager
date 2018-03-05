require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const api = require('api')
const context = require('context')
const {models} = require('stox-bc-request-manager-common')
const {databaseUrl, mqConnectionUrl} = require('config')
const listeners = require('queues/listeners')
const {sample} = require('lodash')
const uuid = require('uuid4')

const service = createService('request-reader', (builder) => {
  builder.db(databaseUrl, models)
  builder.api(api)
  builder.addQueues(mqConnectionUrl, {listeners})
})

const types = ['sendPrize', 'withdraw', 'setWithdrawalAddress', 'sendToBackup', 'createWallet']

const sendRandomRequest = () => context.mq.publish('incomingRequests', {
  id: uuid(),
  type: sample(types),
  data: {userWalletAddress: '123456789012345678901234567890123456789012'},
})

service
  .start()
  .then(c => Object.assign(context, c))
  .then(() => setInterval(sendRandomRequest, 1000))
  .catch(logger.error)

require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const api = require('api')
const context = require('context')
const {models} = require('stox-bc-request-manager-common')
const {databaseUrl, mqConnectionUrl} = require('config')
const listeners = require('queues/listeners')

const service = createService('request-reader', (builder) => {
  builder.db(databaseUrl, models)
  builder.api(api)
  builder.addQueues(mqConnectionUrl, {listeners})
})

const uuid = require('uuid4')

const types = ['sendPrize', 'withdraw', 'setWithdrawalAddress', 'sendToBackup', 'createWallet']
service
  .start()
  .then(c => Object.assign(context,c))
  // .then(() =>
  //   setInterval(
  //     () =>
  //         context.mq.publish('request-reader/incomingRequests', {
  //         id: uuid(),
  //         type: types[Math.floor(Math.random()*5)],
  //         data: {userWalletAddress: '123456789012345678901234567890123456789012'},
  //       }),
  //     1000
  //   ))
  .catch(logger.error)

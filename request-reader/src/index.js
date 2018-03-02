require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService, mq} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const api = require('api')
const db = require('db')
const {models} = require('stox-bc-request-manager-common')
const {databaseUrl, mqConnectionUrl} = require('config')
const queues = require('queues/consumer')

const service = createService('request-reader', (builder) => {
  builder.db(databaseUrl, models, db)
  builder.api(api)
  builder.addQueues(mqConnectionUrl, {listeners: queues})
})

const uuid = require('uuid4')

const types = ['sendPrize', 'withdraw', 'setWithdrawalAddress', 'sendToBackup', 'createWallet']
service
  .start()
  // .then(() =>
  //   setInterval(
  //     () =>
  //       mq.publish('request-reader/incomingRequests', {
  //         id: uuid(),
  //         type: types[Math.floor(Math.random()*5)],
  //         data: {userWalletAddress: '123456789012345678901234567890123456789012'},
  //       }),
  //     1000
  //   ))
  .catch(logger.error)

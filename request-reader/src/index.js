require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService, mq} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const api = require('api')
const db = require('db')
const {models} = require('common')
const {databaseUrl, mqConnectionUrl} = require('config')
const queues = require('queues/consumer')

const service = createService('request-reader', (builder) => {
  builder.db(databaseUrl, models, db)
  builder.api(api)
  builder.addQueues(mqConnectionUrl, {listeners: queues})
})

service.start().catch(logger.error)

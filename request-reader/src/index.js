require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const api = require('api')
const context = require('context')
const {models} = require('stox-bc-request-manager-common')
const {databaseUrl, mqConnectionUrl} = require('config')
const requireAll = require('require-all')
const path = require('path')

const listeners = requireAll(path.resolve(__dirname, 'queues/listeners'))

const service = createService('request-reader', (builder) => {
  builder.db(databaseUrl, models)
  builder.api(api)
  builder.addQueues(mqConnectionUrl, {listeners})
})

service
  .start()
  .then(c => Object.assign(context, c))
  .catch(logger.error)

require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const api = require('api')
const context = require('context')
const {models, initContext} = require('stox-bc-request-manager-common')
const config = require('config')
const requireAll = require('require-all')
const path = require('path')

const listeners = requireAll(path.resolve(__dirname, 'queues/listeners'))
const {databaseUrl, mqConnectionUrl} = config

const builderFunc = (builder) => {
  builder.db(databaseUrl, models)
  builder.api(api)
  builder.addQueues(mqConnectionUrl, {listeners})
}

createService('request-reader', builderFunc)
  .then((service) => {
    Object.assign(context, service.context)
    initContext({...service.context, config})
    return service.start()
  })
  .catch(logger.error)

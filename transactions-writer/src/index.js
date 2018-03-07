require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const context = require('context')
const {models, initContext} = require('stox-bc-request-manager-common')
const config = require('config')
const requireAll = require('require-all')
const path = require('path')

const jobs = requireAll(path.resolve(__dirname, 'jobs'))
const {databaseUrl} = config

const builderFunc = (builder) => {
  builder.db(databaseUrl, models)
  builder.addJobs(jobs)
}

createService('request-reader', builderFunc)
  .then((service) => {
    Object.assign(context, service.context)
    initContext({...service.context, config})
    return service.start()
  })
  .catch(logger.error)

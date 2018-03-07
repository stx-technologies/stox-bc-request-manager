require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {models, initContext} = require('stox-bc-request-manager-common')
const config = require('config')
const requireAll = require('require-all')
const path = require('path')

const {databaseUrl, mqConnectionUrl} = config
const jobs = requireAll(path.resolve(__dirname, 'jobs'))

const builderFunc = (builder) => {
  builder.db(databaseUrl, models)
  builder.addJobs(jobs)
  builder.addQueues(mqConnectionUrl)
}

createService('request-reader', builderFunc)
  .then(context => initContext({...context, config}))
  .catch(logger.error)

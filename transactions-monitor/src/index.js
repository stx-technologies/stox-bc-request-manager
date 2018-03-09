require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {models, initContext} = require('stox-bc-request-manager-common')
const config = require('config')
const requireAll = require('require-all')
const path = require('path')

const jobs = requireAll(path.resolve(__dirname, 'jobs'))
const {databaseUrl, mqConnectionUrl} = config

const builderFunc = (builder) => {
  builder.db(databaseUrl, models)
  builder.addJobs(jobs)
  builder.addQueues(mqConnectionUrl)
}

createService('transaction-monitor', builderFunc)
  .then(context => initContext({...context, config}))
  .catch(logger.error)

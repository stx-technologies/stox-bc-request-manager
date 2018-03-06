require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const context = require('context')
const {models} = require('stox-bc-request-manager-common')
const {databaseUrl} = require('config')
const requireAll = require('require-all')
const path = require('path')

const jobs = requireAll(path.resolve(__dirname, 'jobs'))

const service = createService('request-reader', (builder) => {
  builder.db(databaseUrl, models)
  builder.addJobs(jobs)
})

service
  .start()
  .then(c => Object.assign(context, c))
  .catch(logger.error)

require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const db = require('db')
const {models} = require('stox-bc-request-manager-common')
const {databaseUrl} = require('config')
const jobs = require('jobs')

const service = createService('request-reader', (builder) => {
  builder.db(databaseUrl, models, db)
  builder.addJobs(jobs)
})

service.start().catch(logger.error)

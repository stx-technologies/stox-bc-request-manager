require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createServer} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {initRoutes} = require('app/apiRouter')
const {models} = require('common')
const {port, databaseUrl} = require('app/config')

const server = createServer(port, (builder) => {
  builder.initDb(databaseUrl, models)
  builder.initRoutes(initRoutes)
})

server.start().catch(logger.error)

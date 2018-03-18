require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createService} = require('stox-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const api = require('api')
const {initContext} = require('stox-bc-request-manager-common')
const config = require('config')

const builderFunc = (builder) => {
  builder.addApi(api)
}

createService('transactions-signer', builderFunc)
  .then(context => initContext({...context, config}))
  .catch(logger.error)

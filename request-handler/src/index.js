require('app-module-path').addPath(__dirname) // eslint-disable-line import/no-unresolved
const {createServiceFromFileStructure} = require('stox-common')
const {initContext} = require('stox-bc-request-manager-common')
const config = require('config')

createServiceFromFileStructure(__dirname)
  .then(context => initContext({...context, config}))

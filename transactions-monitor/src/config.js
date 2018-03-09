const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  databaseUrl: '',
  monitorTransactionsCron: '*/5 * * * * *',
  mqConnectionUrl: '',
})

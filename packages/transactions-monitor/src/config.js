const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  databaseUrl: '',
  monitorTransactionsCron: '',
  mqConnectionUrl: '',
  requiredConfirmations: 0,
})

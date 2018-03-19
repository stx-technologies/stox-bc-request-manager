const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  databaseUrl: '',
  writePendingTransactionsCron: '',
  mqConnectionUrl: '',
  web3Url: '',
  transactionsSignerBaseUrl: 'localhost:8090/api/v1',
})

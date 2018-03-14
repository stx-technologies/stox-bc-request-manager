const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  databaseUrl: '',
  mqConnectionUrl: '',
  walletsApiBaseUrl: '',
  network: '',
  handlePendingRequestCron: '*/5 * * * * *',
})

const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  databaseUrl: '',
  walletsApiBaseUrl: '',
  network: '',
  mqConnectionUrl: '',
  handlePendingRequestCron: '',
  limitPendingRequest: '',
})

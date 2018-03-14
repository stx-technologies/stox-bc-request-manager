const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {services: {transactions}} = require('stox-bc-request-manager-common')
const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async (request) => {
    const transactionData = await clientHttp.get('/abi/createWallet')
    const pendingTransactions = [
      {
        requestId: request.id,
        type: 'send',
        from: 'no address',
        to: 'no address',
        network,
        transactionData,
      },
    ]

    try {
      await transactions.createTransactions(pendingTransactions, request.id)

      logger.info({request}, 'CREATE_WALLET')
    } catch (e) {
      logger.error(e, 'CREATE_WALLET_ERROR')
      // todo: update request with error
    }

    return true
  },
}

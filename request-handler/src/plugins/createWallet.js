const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async (request) => {
    const transactionData = await clientHttp.get('/abi/createWallet')
    return [
      {
        requestId: request.id,
        type: 'send',
        from: 'no address',
        to: 'no address',
        network,
        transactionData,
      },
    ]
  },
}

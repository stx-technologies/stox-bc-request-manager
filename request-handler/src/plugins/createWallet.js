const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id}) => {
    const transactionData = await clientHttp.get('/abi/createWallet')

    return {
      requestId: id,
      type: 'send',
      from: 'no address',
      to: 'no address',
      network,
      transactionData,
    }
  },
}

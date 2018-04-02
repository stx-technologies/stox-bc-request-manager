const {network, walletsApiBaseUrl, prizeDistributionAccountAddress} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async (request) => {
    const {id, tokenAddress} = request
    const transactionData = await clientHttp.get('/abi/sendPrize')
    return [
      {
        requestId: id,
        type: 'send',
        from: prizeDistributionAccountAddress,
        to: tokenAddress,
        network,
        transactionData,
      },
    ]
  },
}

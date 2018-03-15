const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {userWalletAddress, tokenAddress, amount}}) => {
    const transactionData = await clientHttp.get('/abi/transferPrize')

    return {
      requestId: id,
      transactionType: 'send',
      from: userWalletAddress,
      to: tokenAddress,
      network,
      transactionData,
    }
  },
}

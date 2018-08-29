const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {walletAddress, tokenAddress, amount}}) => {
    const {encodedAbi, fromAccount} = await clientHttp.get('/abi/withdraw', {
      walletAddress,
      tokenAddress,
      amount,
    })

    return [
      {
        requestId: id,
        type: 'send',
        from: fromAccount,
        to: walletAddress,
        network,
        transactionData: encodedAbi,
      },
    ]
  },
}

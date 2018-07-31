const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {userStoxWalletAddress, amount, tokenAddress, prizeDistributorAddress}}) => {
    const {encodedAbi, fromAccount} = await clientHttp.get('/abi/sendPrizeExternal', {
      userStoxWalletAddress,
      tokenAddress,
      amount,
      prizeDistributorAddress,
    })
    return [
      {
        requestId: id,
        type: 'send',
        from: fromAccount,
        to: tokenAddress,
        network,
        transactionData: encodedAbi,
      },
    ]
  },
}

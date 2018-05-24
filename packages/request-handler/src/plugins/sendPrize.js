const {network, walletsApiBaseUrl, prizeDistributionAccountAddress} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {userStoxWalletAddress, amount, tokenAddress}}) => {
    const {encodedAbi, fromAccount} = await clientHttp.get('/abi/sendPrize', {
      prizeReceiverAddress: userStoxWalletAddress,
      tokenAddress,
      amount,
      prizeDistributorAddress: prizeDistributionAccountAddress,
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

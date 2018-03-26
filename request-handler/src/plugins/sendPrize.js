const {network, walletsApiBaseUrl, prizeDistributionAccountAddress} = require('../config')
const {http} = require('stox-common')
const {oneline} = require('../utils')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {userStoxWalletAddress, amount, tokenAddress}}) => {
    const {encodedAbi, fromAccount} = await clientHttp.get(oneline`/abi/sendPrize?
      prizeReceiverAddress=${userStoxWalletAddress}&
      tokenAddress=${tokenAddress}&
      amount=${amount}&
      prizeDistributorAddress=${prizeDistributionAccountAddress}`)
    return [
      {
        requestId: id,
        type: 'send',
        from: fromAccount,
        to: userStoxWalletAddress,
        network,
        transactionData: encodedAbi,
      },
    ]
  },
}

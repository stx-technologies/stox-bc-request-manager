const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')
const {oneline} = require('../utils')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {walletAddress, tokenAddress, amount, feeTokenAddress, fee}}) => {
    const {encodedAbi, fromAccount} = await clientHttp.get(oneline`/abi/withdraw?
      walletAddress=${walletAddress}&
      tokenAddress=${tokenAddress}&
      amount=${amount}&
      feeTokenAddress=${feeTokenAddress}&
      fee=${fee}`)

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

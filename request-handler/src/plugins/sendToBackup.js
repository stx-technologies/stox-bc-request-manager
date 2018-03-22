const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')
const {oneline} = require('../utils')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {userWithdrawalAddress, walletAddress, tokenAddress, amount}}) => {
    const {encodedAbi, fromAccount} = await clientHttp.get(oneline`/abi/transferToBackup?
      walletAddress=${walletAddress}&
      tokenAddress=${tokenAddress}&
      amount=${amount}`)
    return [
      {
        requestId: id,
        type: 'send',
        from: fromAccount,
        to: userWithdrawalAddress,
        network,
        transactionData: encodedAbi,
      },
    ]
  },
}

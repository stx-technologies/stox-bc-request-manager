const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')
const {oneline} = require('../utils')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {walletAddress, userWithdrawalAddress}}) => {
    const {encodedAbi, fromAccount} =
      await clientHttp.get(oneline`/abi/setWithdrawalAddress?
        walletAddress=${walletAddress}&
        userWithdrawalAddress=${userWithdrawalAddress}`)

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

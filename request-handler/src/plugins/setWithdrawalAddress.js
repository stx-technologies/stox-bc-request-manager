const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {walletAddress, userWithdrawalAddress}}) => {
    const {encodedAbi, fromAccount} = await clientHttp.get('/abi/setWithdrawalAddress', {
      walletAddress,
      userWithdrawalAddress,
    })

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

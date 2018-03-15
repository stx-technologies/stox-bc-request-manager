const {network, walletsApiBaseUrl, walletOperatorAccountAddress} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {userStoxWalletAddress, userWithdrawalAddress}}) => {
    const transactionData = await clientHttp.get('/abi/withdraw')

    return {
      requestId: id,
      type: 'send',
      from: userWithdrawalAddress,
      to: userStoxWalletAddress,
      network,
      transactionData,
    }
  },
}

const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {userWithdrawalAddress}}) => {
    const {transactionData, walletOperatorAccountAddress} = await clientHttp.get('/abi/setWithdrawalAddress', {
      userWithdrawalAddress,
    })

    return [
      {
        requestId: id,
        type: 'send',
        from: walletOperatorAccountAddress,
        to: userWithdrawalAddress,
        network,
        transactionData,
      },
    ]
  },
}

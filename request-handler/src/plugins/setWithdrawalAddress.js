const {network, walletsApiBaseUrl, walletOperatorAccountAddress} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async (request) => {
    const {id, userWithdrawalAddress} = request
    const transactionData = await clientHttp.get('/abi/setWithdrawalAddress')
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

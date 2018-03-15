const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id, data: {userWithdrawalAddress, tokenAddress, amount, feeTokenAddress, fee}}) => {
    const {transactionData, walletOperatorAccountAddress} = await clientHttp.get('/abi/withdraw', {
      tokenAddress,
      amount,
      feeTokenAddress,
      fee,
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

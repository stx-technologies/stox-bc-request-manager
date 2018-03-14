const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {services: {transactions}} = require('stox-bc-request-manager-common')
const {network, walletsApiBaseUrl, walletOperatorAccountAddress} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async (request) => {
    const {id, userWithdrawalAddress} = request
    const transactionData = await clientHttp.get('/abi/setWithdrawalAddress')
    const pendingTransactions = [
      {
        requestId: request.id,
        type: 'send',
        from: walletOperatorAccountAddress,
        to: userWithdrawalAddress,
        network,
        transactionData,
      },
    ]

    try {
      await transactions.createTransactions(pendingTransactions, id)

      logger.info(
        {
          request,
        },
        'SET_WITHDRAWAL_ADDRESS'
      )
    } catch (e) {
      logger.error(e, 'SET_WITHDRAWAL_ADDRESS_ERROR')
    }

    return true
  },
}

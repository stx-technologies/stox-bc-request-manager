const {monitorTransactionsCron} = require('../config')
const promiseSerial = require('promise-serial')
const {
  context,
  services: {transactions, requests},
  utils: {getCompletedTransaction},
} = require('stox-bc-request-manager-common')
const {errors: {logError}} = require('stox-common')

const getError = (transaction, isSuccessful) => {
  if (!isSuccessful) {
    return `transaction ${transaction.id} failed`
  } else if (isSuccessful && transactions.isCancellationTransaction(transaction)) {
    return `request ${transaction.requestId} canceled`
  }
  return undefined
}


module.exports = {
  cron: monitorTransactionsCron,
  job: async () => {
    const uncompletedTransactions = await transactions.getUnconfirmedTransactions()
    context.logger.info({count: uncompletedTransactions.length}, 'UNCOMPLETED_TRANSACTIONS')

    const funcs = uncompletedTransactions.map(transaction => async () => {
      try {
        const completedTransaction = await getCompletedTransaction(transaction.transactionHash)
        if (transactions.isTransactionConfirmed(completedTransaction)) {
          const {requestId} = await transactions.updateCompletedTransaction(transaction, completedTransaction)
          await requests.updateRequestCompleted(
            requestId,
            getError(transaction, completedTransaction.isSuccessful)
          )
          await requests.publishCompletedRequest(await requests.getRequestById(requestId, {withTransactions: true}))
        }
      } catch (e) {
        logError(e, 'MONITOR_TRANSACTION_ERROR')
      }
    })

    try {
      await promiseSerial(funcs)
    } catch (e) {
      logError(e)
    }
  },
}

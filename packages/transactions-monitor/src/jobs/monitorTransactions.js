const {monitorTransactionsCron} = require('../config')
const promiseSerial = require('promise-serial')
const {
  context,
  services: {
    transactions: {
      isCancellationTransaction, getUnconfirmedTransactions, updateCompletedTransaction, isTransactionConfirmed,
      isTimeForResend, resendTransaction,
    },
    requests: {
      updateRequestCompleted,
    },
  },
  utils: {getCompletedTransaction},
} = require('stox-bc-request-manager-common')
const {errors: {logError}} = require('stox-common')

const getRequestError = (transaction, isSuccessful) => {
  if (!isSuccessful) {
    return `transaction ${transaction.id} failed`
  } else if (isSuccessful && isCancellationTransaction(transaction)) {
    return `request ${transaction.requestId} canceled`
  }
  return null
}


module.exports = {
  cron: monitorTransactionsCron,
  job: async () => {
    const uncompletedTransactions = await getUnconfirmedTransactions()
    context.logger.info({count: uncompletedTransactions.length}, 'UNCOMPLETED_TRANSACTIONS')

    const funcs = uncompletedTransactions.map(transaction => async () => {
      try {
        const completedTransaction = await getCompletedTransaction(transaction.transactionHash)
        if (isTransactionConfirmed(completedTransaction)) {
          const {requestId} = await updateCompletedTransaction(transaction, completedTransaction)
          await updateRequestCompleted(
            requestId,
            getRequestError(transaction, completedTransaction.isSuccessful)
          )
        } else if (!transaction.resentAt && isTimeForResend(transaction)) {
          await resendTransaction(transaction)
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

const {monitorTransactionsCron, requiredConfirmations} = require('../config')
const promiseSerial = require('promise-serial')
const {context, services: {transactions}, utils: {getCompletedTransaction}} = require('stox-bc-request-manager-common')
const {errors: {logError}} = require('stox-common')

module.exports = {
  cron: monitorTransactionsCron,
  job: async () => {
    const {mq, logger} = context
    const uncompletedTransactions = await transactions.getUncompletedTransactions()

    context.logger.info({count: uncompletedTransactions.length}, 'UNCOMPLETED_TRANSACTIONS')

    const funcs = uncompletedTransactions.map(transaction => async () => {
      const {transactionHash} = transaction.dataValues

      try {
        const completedTransaction = await getCompletedTransaction(transactionHash)

        if (completedTransaction.confirmations >= requiredConfirmations) {
          const {requestId} = await transactions.updateCompletedTransaction(transaction, completedTransaction)
          mq.publish('completed-requests', {requestId})
        }
      } catch (e) {
        logger.error(e, 'MONITOR_TRANSACTION_ERROR', {transactionId: transaction.Id})
      }
    })

    try {
      await promiseSerial(funcs)
    } catch (e) {
      logError(e)
    }
  },
}

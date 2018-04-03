const {monitorTransactionsCron} = require('../config')
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
        const {requestId} = await transactions.updateCompletedTransaction(transaction, completedTransaction)

        mq.publish('completed-requests', {requestId})
      } catch (e) {
        logger.error(e, 'COMPLETED_TRANSACTION')
      }
    })

    try {
      await promiseSerial(funcs)
    } catch (e) {
      logError(e)
    }
  },
}

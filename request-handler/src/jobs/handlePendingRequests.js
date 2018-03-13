const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {
  utils: {updateSentRecords},
  context: {db},
  services: {requests, transactions},
} = require('stox-bc-request-manager-common')
const {handlePendingRequestCron} = require('../config')
const plugins = require('../plugins')

module.exports = {
  cron: handlePendingRequestCron,
  job: async () => {
    const pendingRequests = await requests.getPendingRequests()

    logger.info({count: pendingRequests.length}, 'PENDING_REQUESTS_COUNT')

    if (pendingRequests.length) {
      const transactionsPromises = pendingRequests.map(request => plugins[request.type](request))
      const requestTransactions = await Promise.all(transactionsPromises)

      const transaction = await db.sequelize.transaction()
      try {
        await transactions.createTransactions(requestTransactions, transaction)

        const pendingRequestsIds = pendingRequests.map(({id}) => id)
        await updateSentRecords(db.requests, pendingRequestsIds, transaction)

        await transaction.commit()
      } catch (e) {
        transaction.rollback()
        throw new UnexpectedError(e)
      }
    }
  },
}

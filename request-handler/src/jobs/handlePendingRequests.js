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
      for (const request of pendingRequests) { // forEach doesn't work with async
        const prepareTransactions = plugins[request.type].prepareTransactions
        const requestTransactions = await prepareTransactions(request)
        const transaction = await db.sequelize.transaction()

        try {
          await transactions.createTransactions(requestTransactions, transaction)

          await db.requests.update({sentAt: Date.now()}, {where: {id: request.id}}, {transaction})

          await transaction.commit()

          logger.info({request: request.id}, 'REQUEST_SUCCESSFULLY_UPDATED')
        } catch (e) {
          transaction.rollback()
          throw new UnexpectedError(e)
        }
      }
    }
  },
}

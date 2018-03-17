const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {
  context: {db},
  services: {requests, transactions},
  utils: {loggerFormatText},
} = require('stox-bc-request-manager-common')
const {handlePendingRequestCron, limitPendingRequest} = require('../config')
const plugins = require('../plugins')

// fix double update on multiple servers
const handleMultipleInstances = async (id) => {
  const {sentAt} = await requests.getRequestById(id)
  if (sentAt) {
    logger.error({}, 'REQUEST_ALREADY_SENT')
  }
  return sentAt
}

module.exports = {
  cron: handlePendingRequestCron,
  job: async () => {
    const pendingRequests = await requests.getPendingRequests(limitPendingRequest)

    logger.info(
      {
        name: 'handlePendingRequests',
        count: pendingRequests.length,
      },
      'PENDING_REQUESTS'
    )

    for (const request of pendingRequests) {
      const {id, type} = request
      // todo: how to handle api error ?
      const pendingTransactions = await plugins[type].prepareTransactions(request)
      const alreadyInProcess = await handleMultipleInstances(id)

      if (!alreadyInProcess) {
        const transaction = await db.sequelize.transaction()

        try {
          await transactions.createTransactions(pendingTransactions, transaction)
          await requests.updateRequest({sentAt: Date.now()}, id, transaction)
          await transaction.commit()

          logger.info({request}, loggerFormatText(type))
        } catch (e) {
          transaction.rollback()
          logger.error(e, `${loggerFormatText(type)}_ERROR`)

          await requests.updateRequest({error: JSON.stringify(e.message)}, id)
        }
      }
    }
  },
}

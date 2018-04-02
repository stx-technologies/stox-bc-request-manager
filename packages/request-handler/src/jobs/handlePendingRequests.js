const {
  context,
  context: {db, mq},
  services: {requests, transactions},
  utils: {loggerFormatText},
} = require('stox-bc-request-manager-common')
const {handlePendingRequestCron, limitPendingRequest} = require('../config')
const plugins = require('plugins')

// fix double update on multiple servers
const handleMultipleInstances = async (id) => {
  const {sentAt} = await requests.getRequestById(id)
  if (sentAt) {
    context.logger.error({}, 'REQUEST_ALREADY_SENT')
  }
  return sentAt
}

module.exports = {
  cron: handlePendingRequestCron,
  job: async () => {
    const pendingRequests = await requests.getPendingRequests(limitPendingRequest)

    context.logger.info({count: pendingRequests.length}, 'PENDING_REQUESTS')
    const requestPromises = pendingRequests.map(async (request) => {
      const transaction = await db.sequelize.transaction()
      const {id, type} = request
      try {
        const pendingTransactions = await plugins[type].prepareTransactions(request)
        const alreadyInProcess = await handleMultipleInstances(id)

        if (!alreadyInProcess) {
          await transactions.createTransactions(pendingTransactions, transaction)
          await requests.updateRequest({sentAt: Date.now()}, id, transaction)
        }

        await transaction.commit()
        context.logger.info({request}, loggerFormatText(type))
        return null
      } catch (e) {
        transaction.rollback()
        context.logger.error(e, `${loggerFormatText(type)}_ERROR`)

        await requests.updateErrorRequest(id, e.message)
        return request
      }
    })
    const failedRequests = (await Promise.all(requestPromises)).filter(a => !!a)

    failedRequests.forEach(request => mq.publish('completed-requests', request.dataValues))
  },
}

const {
  context,
  context: {db, mq},
  services: {requests, transactions},
  utils: {loggerFormatText},
} = require('stox-bc-request-manager-common')
const {handlePendingRequestCron, limitPendingRequest} = require('../config')
const requireAll = require('require-all')
const path = require('path')

const plugins = requireAll(path.resolve(__dirname, '../plugins'))

module.exports = {
  cron: handlePendingRequestCron,
  job: async () => {
    const pendingRequests = await requests.getPendingRequests(limitPendingRequest)

    context.logger.info({count: pendingRequests.length}, 'PENDING_REQUESTS')

    pendingRequests.forEach(async (request) => {
      const transaction = await db.sequelize.transaction()
      const {id, type} = request
      try {
        const pendingTransactions = await plugins[type].prepareTransactions(request)
        await transactions.createTransactions(pendingTransactions, transaction)
        await requests.updateRequest({sentAt: Date.now()}, id, transaction)

        await transaction.commit()

        context.logger.info({request}, loggerFormatText(type))
      } catch (e) {
        transaction.rollback()
        context.logger.error(e, `${loggerFormatText(type)}_ERROR`)

        await requests.updateErrorRequest(id, e)
        await mq.publish('error-requests', request.dataValues)
      }
    })
  },
}

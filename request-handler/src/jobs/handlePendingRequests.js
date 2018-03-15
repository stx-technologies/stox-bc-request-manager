const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {context: {db}, services: {requests, transactions}, utils: {loggerFormatText}} = require('stox-bc-request-manager-common')
const {handlePendingRequestCron} = require('../config')
const plugins = require('../plugins')

module.exports = {
  cron: handlePendingRequestCron,
  job: async () => {
    // todo: take only slice, limit to 10 or some other config value
    const pendingRequests = await requests.getPendingRequests()

    logger.info(
      {
        name: 'handlePendingRequests',
        count: pendingRequests.length,
      },
      'PENDING_REQUESTS'
    )

    for (const request of pendingRequests) {
      const {id, type, sentAt} = request
      const pendingTransactions = await plugins[type].prepareTransactions(request)
      const transaction = await db.sequelize.transaction()

      //not sure if (!sentAt) needed cause pendingRequests its requests that not sent yet
      if (!sentAt) {
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
      } else {
        logger.error({}, 'REQUEST_ALREADY_SENT')
      }

    }

  },
}

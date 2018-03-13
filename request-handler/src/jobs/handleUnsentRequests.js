const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {
  utils: {updateSentRecords},
  context: {mq, db},
  services: {requests, transactions},
} = require('stox-bc-request-manager-common')
const {network, handleUnsentRequestCron} = require('../config')
const plugins = require('../plugins')

module.exports = {
  cron: handleUnsentRequestCron,
  job: async () => {
    const requestsToAdd = await requests.getUnsentRequests()

    logger.info({count: requestsToAdd.length}, 'UNSENT_REQUESTS_COUNT')

    if (requestsToAdd.length) {
      logger.debug('Found new requests: ', requestsToAdd)
      const transactionsPromises = requestsToAdd.map(request => plugins[request.type](request))
      const transactionsToAdd = await Promise.all(transactionsPromises)

      const transaction = await db.sequelize.transaction()
      try {
        await transactions.createTransactions(transactionsToAdd, transaction)

        const requestsIdsToUpdate = requestsToAdd.map(({id}) => id)
        await updateSentRecords(db.requests, requestsIdsToUpdate, transaction)

        await transaction.commit()
      } catch (e) {
        transaction.rollback()
        throw new UnexpectedError(e)
      }
    }
  },
}

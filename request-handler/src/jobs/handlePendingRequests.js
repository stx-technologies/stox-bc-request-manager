const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {services: {requests}} = require('stox-bc-request-manager-common')
const {handlePendingRequestCron} = require('../config')
const plugins = require('../plugins')

const handleRequest = async request => plugins[request.type].prepareTransactions(request)

module.exports = {
  cron: handlePendingRequestCron,
  job: async () => {
    const pendingRequests = await requests.getPendingRequests()

    logger.info(
      {
        count: pendingRequests.length,
      },
      'PENDING_REQUESTS_COUNT'
    )

    await Promise.all(pendingRequests.map(handleRequest))
  },
}

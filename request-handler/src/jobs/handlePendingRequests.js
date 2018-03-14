const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {services: {requests}} = require('stox-bc-request-manager-common')
const {handlePendingRequestCron} = require('../config')
const plugins = require('../plugins')

const handleRequest = async request => plugins[request.type].prepareTransactions(request)

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
      await handleRequest(request)
    }
  },
}

const {context, services: {requests}, utils: {loggerFormatText}} = require('stox-bc-request-manager-common')
const {errors: {logError}} = require('stox-common')
const {handlePendingRequestCron, limitPendingRequest} = require('../config')
const promiseSerial = require('promise-serial')
const {handleRequest} = require('../services/requestHandler')

module.exports = {
  cron: handlePendingRequestCron,
  job: async () => {
    const pendingRequests = await requests.getPendingRequests(limitPendingRequest)

    context.logger.info({count: pendingRequests.length}, 'PENDING_REQUESTS')

    try {
      const funcs = pendingRequests.map(request => async () => {
        const {id, type} = request

        try {
          await handleRequest(request)
          context.logger.info({request: request.dataValues}, loggerFormatText(type))
        } catch (error) {
          await context.mq.publish('error-requests', {...request.dataValues, error})
          context.logger.error(error, `${loggerFormatText(type)}_HANDLER_ERROR`)
          await requests.publishCompletedRequest(await requests.getRequestById(id, true))
        }
      })
      await promiseSerial(funcs)
    } catch (e) {
      logError(e)
    }
  },
}

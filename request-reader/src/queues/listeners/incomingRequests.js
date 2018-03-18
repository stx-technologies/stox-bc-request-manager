const {services: {requests}, context: {mq}} = require('stox-bc-request-manager-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')

module.exports = async (error, {body: message}) => {
  if (error) {
    logger.error(error, 'MESSAGE_FAILED')
    return
  }

  try {
    await requests.createRequest(message)
    logger.info(message, 'MESSAGE_RECIEVED')
  } catch (e) {
    mq.publish('error-requests', {...message, error: e})
    logger.error(e, 'MESSAGE_FAILED')
  }
}

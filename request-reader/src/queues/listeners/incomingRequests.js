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
    const request = await requests.createOrUpdateErrorRequest(message, e.message)
    mq.publish('completed-requests', request.dataValues)
    logger.error(e, 'MESSAGE_FAILED')
  }
}

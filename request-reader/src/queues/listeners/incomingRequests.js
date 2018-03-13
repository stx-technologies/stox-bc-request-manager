const {services} = require('stox-bc-request-manager-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')

module.exports = async (error, {body: message}) => {
  if (error) {
    logger.error(error, 'MESSAGE_FAILED')
  } else {
    try {
      await services.requests.createRequest(message)
      logger.info(message, 'MESSAGE_RECIEVED')
    } catch (e) {
      logger.error(e, 'MESSAGE_FAILED')
    }
  }
}

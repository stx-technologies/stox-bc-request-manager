const {services} = require('stox-bc-request-manager-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')

module.exports = async (error, {body: message}) => {
  if (error) {
    logger.error('Error consuming message from incomingRequests queue: ', error)
  } else {
    await services.requests.createRequest(message)
  }
}

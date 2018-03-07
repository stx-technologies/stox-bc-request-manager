const {services} = require('stox-bc-request-manager-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')

module.exports = (error, {body: message}) => {
  if (error) {
    logger.error('Error consuming message from incomingRequests queue: ', error)
  } else {
    services.requests.createRequest(message)
  }
}

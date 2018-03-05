const {createService} = require('stox-bc-request-manager-common')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const context = require('context')

module.exports = (error, message) => {
  if (error) {
    logger.error('Error consuming message from incomingRequests queue: ', error)
  } else {
    const {requests} = createService(context)
    requests.createRequest(message)
  }
}

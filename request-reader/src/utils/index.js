
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')

const handleQueueMessage = handler => (error, message) => {
  if (error) {
    logger.error('Error consuming message from incomingRequests queue: ', error)
  } else {
    handler(message.body)
  }
}

module.exports = {
  handleQueueMessage,
}

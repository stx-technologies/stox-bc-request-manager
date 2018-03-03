const {createService} = require('stox-bc-request-manager-common')
const context = require('context')
const {handleQueueMessage} = require('utils')

module.exports = handleQueueMessage((message) => {
  const {requests} = createService(context)
  requests.createRequest(message)
})

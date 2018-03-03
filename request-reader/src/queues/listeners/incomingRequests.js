const {createService} = require('stox-bc-request-manager-common')
const context = require('context')
const {handleQueueMessage} = require('utils')

module.exports = handleQueueMessage((message) => {
  const service = createService(context)
  service.createRequest(message)
})

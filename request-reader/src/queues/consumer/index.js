const {createService} = require('common')
const db = require('db')
const service = createService(db)

module.exports = {
  incomingRequests: service.createRequest,
}

const {port} = require('config')
const {services: {requests}} = require('stox-bc-request-manager-common')

module.exports = {
  port,
  version: 1,
  cors: false,
  routes: (router, _) => {
    router.post('/requests', _(({body}) => requests.createRequest(body)))
    router.get('/requests/:id', _(({params: {id}}) => requests.getRequestById(id)))
    router.get('/requests/transactions/:id', _(({params: {id}}) => requests.getRequestByTransactionId(id)))
    router.get('/requests/:type/count', _(({params: {type}}) => requests.countRequestByType(type)))
    router.get('/requests/:type/count/pending', _(({params: {type}}) => requests.countRequestByType(type, true)))
  },
}

const {port} = require('config')
const {services} = require('stox-bc-request-manager-common')

module.exports = {
  port,
  version: 1,
  cors: false,
  routes: (router, _) => {
    router.post('/requests/', _(({body}) => services.requests.createRequest(body)))
    router.get('/requests/:id', _(({params: {id}}) => services.requests.getRequestById(id)))
    router.get('/requests/transactions/:id', _(({params: {id}}) => services.requests.getRequestByTransactionId(id)))
    router.get('/requests/:type/count', _(({params: {type}}) => services.requests.countRequestByType(type)))
  },
}


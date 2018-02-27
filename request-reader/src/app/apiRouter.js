const {requests} = require('common')

const initRoutes = (router, _) => {

  router.post('/requests/', _(({body}) => requests.createRequest(body)))

  router.get('/requests/:id', _(({params: {id}}) => requests.getRequestById(id)))

  router.get('/requests/transactions/:id', _(({params: {id}}) => requests.getRequestByTransactionId(id)))

  router.get('/requests/:type/count', _(({params: {type}}) => requests.countRequestByType(type)))

}

module.exports = {initRoutes}

const {createService} = require('stox-bc-request-manager-common')
const {port} = require('config')
const context = require('context')

module.exports = {
  port,
  version: 1,
  cors: false,
  routes: (router, _) => {
    router.post(
      '/requests/',
      _(({body}) => {
        const {requests} = createService(context)
        return requests.createRequest(body)
      })
    )
    router.get(
      '/requests/:id',
      _(({params: {id}}) => {
        const {requests} = createService(context)
        return requests.getRequestById(id)
      })
    )
    router.get(
      '/requests/transactions/:id',
      _(({params: {id}}) => {
        const {requests} = createService(context)
        return requests.getRequestByTransactionId(id)
      })
    )
    router.get(
      '/requests/:type/count',
      _(({params: {type}}) => {
        const {requests} = createService(context)
        return requests.countRequestByType(type)
      })
    )
  },
}

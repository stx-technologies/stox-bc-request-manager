const {port} = require('config')
const {
  services: {requests, transactions, gasPrices},
  utils: {getCompletedTransaction},
} = require('stox-bc-request-manager-common')

module.exports = {
  port,
  version: 1,
  cors: false,
  routes: (router, _) => {
    router.get('/gasPrices', _(() => gasPrices.getGasPercentilesInGwei()))
    router.get('/gasPriceByPriority', _(({query: {priority}}) =>
      gasPrices.gasPriceByPriority(priority)))
    router.post('/requests', _(({body}) => requests.createRequest(body)))
    router.post('/requests/increasePriority', _(({body}) => requests.increasePriority(body)))
    router.get('/requests/:id', _(({params: {id}}) => requests.getRequestById(id)))
    router.get('/requests/:id/transactions', _(({params: {id}}) =>
      requests.getRequestById(id, {withTransactions: true})))
    router.get('/requests/transactions/:id', _(({params: {id}}) => requests.getRequestByTransactionId(id)))
    router.get('/requests/:type/count', _(({params: {type}}) => requests.countRequestByType(type)))
    router.get('/requests/:type/count/pending', _(({params: {type}}) => requests.countPendingRequestByType(type)))
    router.post('/transactions/resend', _(async ({body: {transactionHash}}) =>
      transactions.resendTransaction(transactionHash)))
    router.get('/requestsByTransactionHash/:transactionHash', _(({params: {transactionHash}}) =>
      requests.getRequestByTransactionHash(transactionHash)))
    router.get('/blockchain/transactions/:transactionHash', _(({params: {transactionHash}}) =>
      getCompletedTransaction(transactionHash)))
  },
}

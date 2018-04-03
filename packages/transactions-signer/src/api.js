const {port} = require('config')
const signer = require('./services/signer')

module.exports = {
  port,
  version: 1,
  cors: false,
  routes: (router, _) => {
    router.post('/transactions/sign', _(({body: {fromAddress, unsignedTransaction, transactionId}}) =>
      signer.signTransaction(fromAddress, unsignedTransaction, transactionId)))
  },
}


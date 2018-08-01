const {port} = require('config')
const {signTransaction, encrypt} = require('./services')

module.exports = {
  port,
  version: 1,
  cors: false,
  routes: (router, _) => {
    router.post('/transactions/sign', _(({body: {fromAddress, unsignedTransaction, transactionId}}) =>
      signTransaction(fromAddress, unsignedTransaction, transactionId)))

    router.post('/encrypt', _(({body: {privateKey}}) =>
      encrypt(privateKey)))

  },
}


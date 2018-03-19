const {keys} = require('config')
const EthereumTx = require('ethereumjs-tx')
const {context: {logger}} = require('stox-bc-request-manager-common')

const signTransaction = (from, unsignedTransaction, transactionId) => {
  const privateKey = Buffer.from(JSON.parse(keys)[from], 'hex')
  const transaction = new EthereumTx(unsignedTransaction)
  transaction.sign(privateKey)
  const signedTransaction = `0x${transaction.serialize().toString('hex')}`
  logger.info({from, unsignedTransaction, signedTransaction, transactionId}, 'TRANSACTION_SIGNED')
  return signedTransaction
}

module.exports = {
  signTransaction,
}

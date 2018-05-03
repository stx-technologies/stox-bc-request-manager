const {getPrivateKey} = require('./kms')
const EthereumTx = require('ethereumjs-tx')
const {context} = require('stox-bc-request-manager-common')

const sign = (privateKey, from, unsignedTransaction, transactionId) => {
  const transaction = new EthereumTx(unsignedTransaction)
  transaction.sign(privateKey)
  const signedTransaction = `0x${transaction.serialize().toString('hex')}`
  context.logger.info({from, unsignedTransaction, signedTransaction, transactionId}, 'TRANSACTION_SIGNED')
  return signedTransaction
}

const signTransaction = async (from, unsignedTransaction, transactionId) => {
  const privateKey = await getPrivateKey(from)
  return sign(privateKey, from, unsignedTransaction, transactionId)
}

module.exports = {
  signTransaction,
}

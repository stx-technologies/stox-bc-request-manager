const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {keys} = require('config')
const EthereumTx = require('ethereumjs-tx')
const {context} = require('stox-bc-request-manager-common')

const signTransaction = (from, unsignedTransaction, transactionId) => {
  const publicKey = JSON.parse(keys)[from]

  if (!publicKey) {
    throw new UnexpectedError('Invalid Public Key', {from})
  }
  const privateKey = Buffer.from(JSON.parse(keys)[from], 'hex')
  const transaction = new EthereumTx(unsignedTransaction)
  transaction.sign(privateKey)
  const signedTransaction = `0x${transaction.serialize().toString('hex')}`
  context.logger.info({from, unsignedTransaction, signedTransaction, transactionId}, 'TRANSACTION_SIGNED')
  return signedTransaction
}

module.exports = {
  signTransaction,
}

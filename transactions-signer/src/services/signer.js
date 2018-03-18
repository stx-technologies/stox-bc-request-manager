const {keys} = require('config')
const EthereumTx = require('ethereumjs-tx')

const signTransaction = (from, unsignedTransaction) => {
  const privateKey = Buffer.from(JSON.parse(keys)[from], 'hex')
  const transaction = new EthereumTx(unsignedTransaction)
  transaction.sign(privateKey)
  return `0x${transaction.serialize().toString('hex')}`
}

module.exports = {
  signTransaction,
}


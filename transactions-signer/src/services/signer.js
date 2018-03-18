const EthereumTx = require('ethereumjs-tx')

const signTransaction = (from, unsignedTransaction) => {
  // TODO: Get matching private key from keystore
  // This is an example private key for 0xC2D7CF95645D33006175B78989035C7c9061d3F9
  const privateKey = Buffer.from('3a1076bf45ab87712ad64ccb3b10217737f7faacbf2872e88fdd9a537d8fe266', 'hex')
  const transaction = new EthereumTx(unsignedTransaction)
  transaction.sign(privateKey)
  return `0x${transaction.serialize().toString('hex')}`
}

module.exports = {
  signTransaction,
}


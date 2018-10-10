const {decrypt} = require('./kms')
const EthereumTx = require('ethereumjs-tx')
const converter = require('hex2dec')
const {context} = require('stox-bc-request-manager-common')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {transactionSignerKeys} = require('config')

const BLOCKCHAIN_PRIVATE_KEY_LENGTH = 66
const shouldDecrypt = privateKey => privateKey.length > BLOCKCHAIN_PRIVATE_KEY_LENGTH
const truncatePrefix = privateKey =>
  (privateKey.length === BLOCKCHAIN_PRIVATE_KEY_LENGTH ? privateKey.substring(2) : privateKey)

const getPrivateKey = async (from) => {
  const privateKey = JSON.parse(transactionSignerKeys)[from]
  if (!privateKey) {
    throw new UnexpectedError('Invalid Public Key', {from})
  }
  try {
    const decryptedKey = shouldDecrypt(privateKey) ? await decrypt(privateKey) : privateKey
    return Buffer.from(truncatePrefix(decryptedKey), 'hex')
  } catch (e) {
    throw new UnexpectedError('Failed Decrypting', e)
  }
}

const sign = (privateKey, from, unsignedTransaction, transactionId) => {
  unsignedTransaction.value = converter.decToHex(unsignedTransaction.value)
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

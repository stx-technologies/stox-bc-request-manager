const AWS = require('aws-sdk')
const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {kmsKeyId, keys} = require('config')

const kms = new AWS.KMS()

const BLOCKCHAIN_PRIVATE_KEY_LENGTH = 64

const decrypt = encryptedKey => new Promise((resolve, reject) => {
  const params = {
    CiphertextBlob: Buffer.from(encryptedKey, 'base64'),
  }
  kms.decrypt(params, (err, data) => {
    if (err) {
      reject(err)
    } else {
      resolve(data.Plaintext.toString('utf-8'))
    }
  })
})

const encrypt = privateKey => new Promise((resolve, reject) => {
  const params = {
    KeyId: kmsKeyId,
    Plaintext: privateKey,
  }
  kms.encrypt(params, (err, data) => {
    if (err) {
      reject(err)
    } else {
      resolve(data.CiphertextBlob.toString('base64'))
    }
  })
})

const shouldDecrypt = privateKey => privateKey.length > BLOCKCHAIN_PRIVATE_KEY_LENGTH

const getPrivateKey = async (from) => {
  const privateKey = JSON.parse(keys)[from]
  if (!privateKey) {
    throw new UnexpectedError('Invalid Public Key', {from})
  }
  try {
    const decryptedKey = shouldDecrypt(privateKey) ? await decrypt(privateKey) : privateKey
    return Buffer.from(decryptedKey, 'hex')
  } catch (e) {
    throw new UnexpectedError('Failed Decrypting', e)
  }
}

module.exports = {
  encrypt,
  getPrivateKey,
}

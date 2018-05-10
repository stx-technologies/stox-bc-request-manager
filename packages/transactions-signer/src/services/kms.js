const AWS = require('aws-sdk')
const {kmsKeyId} = require('config')

const kms = new AWS.KMS()

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

module.exports = {
  encrypt,
  decrypt,
}

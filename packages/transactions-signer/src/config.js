const {configs: {mapEnv}} = require('@welldone-software/node-toolbelt')

module.exports = mapEnv({
  port: '',
  transactionSignerKeys: '',
  kmsKeyId: '',
  awsRegion: '',
})

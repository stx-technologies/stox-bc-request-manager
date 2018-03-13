const {withdraw} = require('./withdraw')
const {sendPrize} = require('./sendPrize')
const {setWithdrawalAddress} = require('./setWithdrawalAddress')
const {createWallet} = require('./createWallet')
const {sendToBackup} = require('./sendToBackup')

module.exports = {
  withdraw,
  sendPrize,
  setWithdrawalAddress,
  createWallet,
  sendToBackup,
}
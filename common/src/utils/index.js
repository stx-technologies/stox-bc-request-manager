const {Op} = require('sequelize')
const {snakeCase} = require('lodash')
const {blockchain} = require('../context')

const updateSentRecords = (table, ids, transaction) =>
  table.update({sentAt: Date.now()}, {where: {id: {[Op.in]: ids}}}, {transaction})

const loggerFormatText = text => snakeCase(text).toUpperCase()

const secondsToDate = date => new Date(date * 1000)

const getCompletedTransaction = async (transactionHash, currentBlockNumber) => {
  if (currentBlockNumber === undefined) {
    currentBlockNumber = await blockchain.web3.eth.getBlockNumber()
  }

  const transactionReceipt = await blockchain.web3.eth.getTransactionReceipt(transactionHash)

  if (transactionReceipt) {
    const isSuccessful = transactionReceipt.status === '0x1'
    return {
      isSuccessful,
      blockTime: secondsToDate((await blockchain.web3.eth.getBlock(transactionReceipt.blockNumber, false)).timestamp),
      confirmations: isSuccessful ? currentBlockNumber - transactionReceipt.blockNumber : undefined,
      receipt: transactionReceipt,
    }
  }

  return undefined
}

module.exports = {
  updateSentRecords,
  loggerFormatText,
  getCompletedTransaction,
}

const {Op} = require('sequelize')
const {snakeCase} = require('lodash')
const {blockchain} = require('../context')
const {Big} = require('big.js')

const updateSentRecords = (table, ids, transaction) =>
  table.update({sentAt: Date.now()}, {where: {id: {[Op.in]: ids}}}, {transaction})

const loggerFormatText = text => snakeCase(text).toUpperCase()

const secondsToDate = date => new Date(date * 1000)

const calculateGasCost = ({gasLimit, gasPrice}) => Big(gasLimit).times(gasPrice).toString()

const getCompletedTransaction = async (transactionHash, currentBlockNumber) => {
  if (!currentBlockNumber) {
    currentBlockNumber = await blockchain.web3.eth.getBlockNumber()
  }

  const transactionReceipt = await blockchain.web3.eth.getTransactionReceipt(transactionHash)

  if (transactionReceipt) {
    // status field is not set for parity dev chain. Will be fixed on parity 1.10.
    // On main ethereum chain (post byzantium fork) it can only be 0 or 1.
    // For now we consider null status as a success
    // See also:
    // https://github.com/paritytech/parity/issues/7735
    // https://github.com/paritytech/parity/pull/7753
    const isSuccessful = (
      transactionReceipt.status === true ||
      transactionReceipt.status === '0x1' ||
      transactionReceipt.status === null)
    return {
      isSuccessful,
      blockTime: transactionReceipt.blockNumber ?
        secondsToDate((await blockchain.web3.eth.getBlock(transactionReceipt.blockNumber, false)).timestamp) :
        undefined,
      confirmations: transactionReceipt.blockNumber ?
        currentBlockNumber - transactionReceipt.blockNumber :
        undefined,
      receipt: transactionReceipt,
    }
  }

  return undefined
}

module.exports = {
  updateSentRecords,
  loggerFormatText,
  getCompletedTransaction,
  calculateGasCost,
}

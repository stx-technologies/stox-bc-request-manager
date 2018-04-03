const {Op} = require('sequelize')
const {snakeCase} = require('lodash')
const {blockchain} = require('../context')

const updateSentRecords = (table, ids, transaction) =>
  table.update({sentAt: Date.now()}, {where: {id: {[Op.in]: ids}}}, {transaction})

const loggerFormatText = text => snakeCase(text).toUpperCase()

const secondsToDate = date => new Date(date * 1000)

const getCompletedTransaction = async (transactionHash, currentBlockNumber) => {
  const oo = {
    isSuccessful: true,
    blockTime: "2018-03-06T09:46:26.000Z",
    confirmations: 83463,
    receipt: {
      blockHash: '0xf54048f84fa9fb4bab2ad2fc35fda870f8710f35b873aec6ad4e92f98ad9282c',
      blockNumber: 5206010,
      contractAddress: null,
      cumulativeGasUsed: 5154164,
      gasUsed: 37344,
      logs: [{
        address: '0x006BeA43Baa3f7A6f765F14f10A1a1b08334EF45',
        blockHash: '0xf54048f84fa9fb4bab2ad2fc35fda870f8710f35b873aec6ad4e92f98ad9282c',
        blockNumber: 5206010,
        data: '0x000000000000000000000000000000000000000000000015af1d78b58c400000',
        logIndex: 55,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x000000000000000000000000aa1aeffe8bf1a7470558b31f35cb6ec7faf0679f',
          '0x0000000000000000000000008b4059126dd6a7d187d59197006dbc66c69880a0',
        ],
        transactionHash: '0x7228eb511bd73ed2b8bfb19c89324e02a203621ac3e33f55ef4e221b16daa52d',
        transactionIndex: 75,
        transactionLogIndex: '0x0',
        type: 'mined',
        id: 'log_b425ac49',
      }],
      logsBloom: '0x00000000000000000000020000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000040000000000000000000000000000000000000000000000000000000000000000000100000000010000000000000000000000000000000000000001000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000002000000100000000000000000000000000000000000000000000000000000000000000000000004000000000800000000000000000000000000000000',
      root: null,
      status: '0x1',
      transactionHash: '0x7228eb511bd73ed2b8bfb19c89324e02a203621ac3e33f55ef4e221b16daa52d',
      transactionIndex: 75,
    },
  }
  
  return Promise.resolve(oo)
}

// const getCompletedTransaction = async (transactionHash, currentBlockNumber) => {
//   if (currentBlockNumber === undefined) {
//     currentBlockNumber = await blockchain.web3.eth.getBlockNumber()
//   }

//   const transactionReceipt = await blockchain.web3.eth.getTransactionReceipt(transactionHash)

//   if (transactionReceipt) {
//     const isSuccessful = transactionReceipt.status === '0x1'
//     return {
//       isSuccessful,
//       blockTime: secondsToDate((await blockchain.web3.eth.getBlock(transactionReceipt.blockNumber, false)).timestamp),
//       confirmations: currentBlockNumber - transactionReceipt.blockNumber,
//       receipt: transactionReceipt,
//     }
//   }

//   return undefined
// }

module.exports = {
  updateSentRecords,
  loggerFormatText,
  getCompletedTransaction,
}

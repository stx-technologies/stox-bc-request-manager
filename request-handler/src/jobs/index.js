const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-bc-request-manager-common')
const db = require('db')
const {mq} = require('stox-common')

const service = createService(db)

const withdraw = async ({data: {userWalletAddress, amount, tokenAddress, feeAmount, feeTokenAddress}, id}) => {
  // TODO: get clear api about walletABI input and output...
  const response = await mq.rpc('wallets-sync/walletABI', {address: userWalletAddress})
  const {data, address} = response.body
  return {
    requestId: id,
    type: 'send',
    from: address,
    to: userWalletAddress,
    network: 'Main',
    transactionData: new Buffer(data),
  }
}

const prepareTransactionPlugin = {
  withdraw,
  sendPrize: withdraw,
  setWithdrawalAddress: withdraw,
  createWallet: withdraw,
  sendToBackup: withdraw,
}

module.exports = {
  walletsPool: {
    cron: '*/05 * * * * *',
    job: async () => {
      const transaction = await db.sequelize.transaction()
      try {
        const requests = await service.getAllUnsentFromTable(db.requests, transaction)
        if (requests.length) {
          logger.debug('Found new requests: ', requests)
          const transactionsPromises = requests.map(requests => prepareTransactionPlugin[requests.type](requests))
          const transactionsToAdd = await Promise.all(transactionsPromises)
          await db.transactions.bulkCreate(transactionsToAdd, {transaction})
          const requestsIdsToUpdate = requests.map(({id}) => id)

          await service.updateSentRecords(db.requests, requestsIdsToUpdate, transaction)
        }

        await transaction.commit()
      } catch (e) {
        transaction.rollback()
        throw new UnexpectedError(e)
      }
    },
  },
}

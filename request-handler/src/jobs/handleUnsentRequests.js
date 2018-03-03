const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-bc-request-manager-common')
const context = require('context')

const withdraw = async ({data: {userWalletAddress, amount, tokenAddress, feeAmount, feeTokenAddress}, id}, mq) => {
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
  cron: '*/05 * * * * *',
  job: async () => {
    const service = createService(context)
    const {db, mq} = context
    const transaction = await db.sequelize.transaction()
    try {
      const requests = await service.getAllUnsentFromTable(db.requests, transaction)
      if (requests.length) {
        logger.debug('Found new requests: ', requests)

        const transactionsPromises = requests.map(request => prepareTransactionPlugin[request.type](request, mq))
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
}

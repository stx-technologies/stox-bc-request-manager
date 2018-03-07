const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {utils: {updateSentRecords}, context, services: {requests, transactions}} = require('stox-bc-request-manager-common')

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
    transactionData: Buffer.from(data),
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
    const {db, mq} = context
    const requestsToAdd = await requests.getUnsentRequests()
    if (requestsToAdd.length) {
      logger.debug('Found new requests: ', requestsToAdd)
      const transactionsPromises = requestsToAdd.map(request => prepareTransactionPlugin[request.type](request, mq))
      const transactionsToAdd = await Promise.all(transactionsPromises)

      const transaction = await db.sequelize.transaction()
      try {
        await transactions.createTransactions(transactionsToAdd, transaction)

        const requestsIdsToUpdate = requestsToAdd.map(({id}) => id)
        await updateSentRecords(db.requests, requestsIdsToUpdate, transaction)

        await transaction.commit()
      } catch (e) {
        transaction.rollback()
        throw new UnexpectedError(e)
      }
    }
  },
}

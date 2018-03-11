const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {
  utils: {updateSentRecords},
  context: {mq, db},
  services: {requests, transactions},
} = require('stox-bc-request-manager-common')
const {network, handleUnsentRequestCron} = require('../config')

// eslint-disable-next-line no-unused-vars
const withdraw = async ({data: {userWalletAddress, amount, tokenAddress, feeAmount, feeTokenAddress}, id}) => {
  // TODO: get clear api about walletABI input and output...
  const {body: {data, address}} = await mq.rpc('walletABI', {address: userWalletAddress})
  return {
    requestId: id,
    type: 'send',
    from: address,
    to: userWalletAddress,
    network,
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
  cron: handleUnsentRequestCron,
  job: async () => {
    const requestsToAdd = await requests.getUnsentRequests()
    if (requestsToAdd.length) {
      logger.debug('Found new requests: ', requestsToAdd)
      const transactionsPromises = requestsToAdd.map(request => prepareTransactionPlugin[request.type](request))
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

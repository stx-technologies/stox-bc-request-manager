const {context: {db, mq}} = require('stox-bc-request-manager-common')
const {errors: {logError}} = require('stox-common')

module.exports = async ({body: message}) => {
  try {
    const transactions = await Promise.all(message.transactions.map(async (transaction) => {
      const transactionFromDb = await db.transactions.findOne({
        where: {transactionHash: transaction.transactionHash},
        include: [{model: db.requests}],
      })
      return transactionFromDb ?
        {...transaction, requestId: transactionFromDb.requestId, type: transactionFromDb.request.type} :
        {...transaction, type: message.address === transaction.from ? 'withdraw' : 'deposit'}
    }))
    mq.publish('blockchain-token-transfers', {...message, transactions})
  } catch (e) {
    logError(e)
  }
}

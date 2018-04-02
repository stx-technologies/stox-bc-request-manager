const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {monitorTransactionsCron} = require('../config')
const {
  context,
  services: {transactions, requests},
} = require('stox-bc-request-manager-common')

// TODO FOR DANNY HELMAN
// eslint-disable-next-line no-unused-vars
const validateParityNode = async transaction => true

// eslint-disable-next-line no-unused-vars
const validateConfirmations = async transaction => true

// TODO by Danny hellman: fill Receipt, Blocknumber, BlockTime
// eslint-disable-next-line no-unused-vars
const updateTransaction = (bcTransaction, transaction) =>
  bcTransaction.update(
    {
      completedAt: Date.now(),
    },
    {transaction}
  )

const updateRequest = (request, bcTransaction, transaction) =>
  request.update(
    {
      completedAt: Date.now(),
      error: bcTransaction.error,
    },
    {transaction}
  )

const getTransactionToAdd = async () => {
  const transactionsToCheck = await transactions.getUnhandledSentTransactions()
  const validatedTransactions = await Promise.all(transactionsToCheck.map(async bcTransaction => ({
    parityNode: await validateParityNode(bcTransaction),
    confirmations: await validateConfirmations(bcTransaction),
    transaction: bcTransaction,
  })))
  return validatedTransactions
    .filter(({parityNode, confirmations}) => parityNode && confirmations)
    .map(({transaction}) => transaction)
}

module.exports = {
  cron: monitorTransactionsCron,
  job: async () => {
    const {db, mq} = context
    const transactionToAdd = await getTransactionToAdd()
    const correspondingRequests = await requests.getCorrespandingRequests(transactionToAdd)
    const transaction = await db.sequelize.transaction()
    try {
      await Promise.all(transactionToAdd.map(bcTransaction => updateTransaction(bcTransaction, transaction)))
      await Promise.all(correspondingRequests.map(request =>
        updateRequest(request, transactionToAdd.find(({requestId}) => requestId === request.id), transaction)))
      await transaction.commit()
    } catch (e) {
      transaction.rollback()
      throw new UnexpectedError(e)
    }

    correspondingRequests.forEach(request => mq.publish(request.type, request))
  },
}

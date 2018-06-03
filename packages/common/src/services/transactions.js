const {db} = require('../context')
const {exceptions: {NotFoundError, InvalidStateError}} = require('@welldone-software/node-toolbelt')
const {errors: {errSerializer}} = require('stox-common')
const {calcGasPriceForResend} = require('./gasPrices')


const createTransaction = ({id, type, from}) => db.transactions.create({id, type, from})

const isResendTransaction = transaction => transaction.originalTransactionId || transaction.resentAt

const getTransaction = async (query) => {
  const transaction = await db.transactions.findOne({where: query})
  if (!transaction) {
    throw new NotFoundError('transactionNotFound', query)
  }

  return transaction
}

const validateTransactionForResend = (transaction) => {
  const throwError = (msg) => {
    throw new InvalidStateError(msg)
  }
  return transaction.error ? throwError('transactionError')
    : transaction.completedAt ? throwError('transactionCompleted')
      : !transaction.sentAt ? throwError('transactionNotSentYet')
        : transaction.resentAt ? throwError('transactionAlreadyResent')
          : transaction.canceledAt ? throwError('transactionCanceled') : true
}

const resendTransaction = async (transactionHash) => {
  const transaction = await getTransaction({transactionHash})
  validateTransactionForResend(transaction.dataValues)
  const dbTransaction = await db.sequelize.transaction()
  const {requestId, type, subRequestIndex, subRequestData, subRequestType,
    transactionData, network, from, to, nonce, gasPrice, originalTransactionId, id} = transaction.dataValues
  const newGasPrice = await calcGasPriceForResend(gasPrice)
  if (!newGasPrice) {
    throw new InvalidStateError('MAXIMUM_GAS_PRICE')
  }
  try {
    await transaction.update({resentAt: Date.now()}, {transaction: dbTransaction})
    await db.transactions.create(
      {requestId,
        type,
        subRequestIndex,
        subRequestData,
        subRequestType,
        transactionData,
        network,
        from,
        to,
        nonce,
        gasPrice: newGasPrice,
        originalTransactionId: originalTransactionId || id},
      {transaction: dbTransaction}
    )
    await dbTransaction.commit()
  } catch (e) {
    dbTransaction.rollback()
    throw e
  }
}


const getPendingTransactions = limit => db.transactions.findAll({where: {sentAt: null, completedAt: null}, limit})

const getUnconfirmedTransactions = limit =>
  db.transactions.findAll({
    where: {
      sentAt: {
        $ne: null,
      },
      completedAt: null,
    },
    limit,
  })

const rejectRelatedTransactions = async ({id, transactionHash, nonce, from}, transaction) => db.transactions.update(
  {error: {reason: 'transaction override', transactionId: id, transactionHash}, completedAt: Date.now()},
  {
    where: {
      id: {$ne: id},
      nonce,
      from,
    },
  },
  transaction
)

const updateCompletedTransaction = async (transactionInstance, {isSuccessful, blockTime, receipt}) => {
  const transaction = await db.sequelize.transaction()
  try {
    await rejectRelatedTransactions(transactionInstance, transaction)
    await transactionInstance.updateAttributes(
      {
        completedAt: Date.now(),
        receipt,
        currentBlockTime: blockTime,
        blockNumber: receipt.blockNumber,
        error: isSuccessful ? null : {message: 'error in blockchain transaction'},
      },
      {
        transaction,
      }
    )
    await transaction.commit()

    return transactionInstance.dataValues
  } catch (e) {
    transaction.rollback()
    throw e
  }
}

const addTransactions = async (requestId, transactions) => {
  const transaction = await db.sequelize.transaction()

  try {
    await db.transactions.bulkCreate(transactions, {transaction})
    await db.requests.update({transactionPreparedAt: Date.now()}, {where: {id: requestId}}, {transaction})
    await transaction.commit()
  } catch (error) {
    transaction.rollback()
    throw error
  }
}

const minutesFromSent = (transaction) => {
  const now = new Date()
  const sendAt = new Date(transaction.dataValues.sentAt)
  const diff = now.getTime() - sendAt.getTime()
  return (diff / 60000)
}

const updateTransactionError = (id, error) =>
  db.transactions.update({error: errSerializer(error), completedAt: Date.now()}, {where: {id}})

module.exports = {
  getTransaction,
  createTransaction,
  getPendingTransactions,
  getUnconfirmedTransactions,
  updateCompletedTransaction,
  addTransactions,
  minutesFromSent,
  resendTransaction,
  updateTransactionError,
  isResendTransaction,

}

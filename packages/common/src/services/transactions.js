const {db} = require('../context')
const {exceptions: {NotFoundError}} = require('@welldone-software/node-toolbelt')
const {errors: {errSerializer}} = require('stox-common')

const createTransaction = ({id, type, from}) => db.transactions.create({id, type, from})

const getTransaction = async (query) => {
  const transaction = await db.transactions.findOne({where: query})
  if (!transaction) {
    throw new NotFoundError('transactionNotFound', query)
  }

  return transaction
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

const updateCompletedTransaction = async ({id, transactionHash}, {isSuccessful, blockTime, receipt}) => {
  const transaction = await db.sequelize.transaction()

  try {
    const transactionInstance = await db.transactions.findOne({where: {id}, transaction})
    const requestInstance = await db.transactions.findOne({where: {transactionHash}, transaction})

    await requestInstance.updateAttributes({completedAt: new Date()}, {transaction})
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

    return requestInstance.dataValues
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

const updateTransactionError = (id, error) =>
  db.transactions.update({error: errSerializer(error), completedAt: Date.now()}, {where: {id}})

module.exports = {
  getTransaction,
  createTransaction,
  getPendingTransactions,
  getUnconfirmedTransactions,
  updateCompletedTransaction,
  addTransactions,
  updateTransactionError,
}

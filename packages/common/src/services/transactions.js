const {db} = require('../context')
const {exceptions: {NotFoundError}} = require('@welldone-software/node-toolbelt')


const createTransaction = ({id, type, from}) => db.transactions.create({id, type, from})

const getTransaction = async (query) => {
  const transaction = await db.transactions.findOne({where: query})
  if (!transaction) {
    throw new NotFoundError('transactionNotFound', query)
  }

  return transaction
}

const createTransactions = (transactions, sequelizeTransaction) =>
  db.transactions.bulkCreate(transactions, {transaction: sequelizeTransaction})

const getPendingTransactions = limit => db.transactions.findAll({where: {sentAt: null}, limit})

const getUncompletedTransactions = limit =>
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
    const transactionModel = await db.transactions.findOne({where: {id}, transaction})
    const requestModel = await db.transactions.findOne({where: {transactionHash}, transaction})

    await requestModel.updateAttributes({completedAt: new Date()}, {transaction})
    await transactionModel.updateAttributes(
      {
        completedAt: Date.now(),
        receipt: JSON.stringify(receipt),
        currentBlockTime: blockTime,
        blockNumber: receipt.blockNumber,
        error: !isSuccessful,
      },
      {
        transaction,
      },
    )
    await transaction.commit()

    return requestModel.dataValues
  } catch (e) {
    transaction.rollback()
    throw e
  }
}

module.exports = {
  getTransaction,
  createTransaction,
  createTransactions,
  getPendingTransactions,
  getUncompletedTransactions,
  updateCompletedTransaction,
}

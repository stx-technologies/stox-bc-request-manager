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

const getPendingTransactions = () => db.transactions.findAll({where: {sentAt: null}})

const getUnhandledSentTransactions = () =>
  db.transactions.findAll({
    where: {
      sentAt: {
        $ne: null,
      },
      completedAt: null,
    },
  })

module.exports = {
  getTransaction,
  createTransaction,
  createTransactions,
  getPendingTransactions,
  getUnhandledSentTransactions,
}

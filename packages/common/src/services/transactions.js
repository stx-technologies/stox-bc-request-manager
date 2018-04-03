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

const getPendingTransactions = limit => db.transactions.findAll({where: {sentAt: null}, limit})

const getUnhandledSentTransactions = limit =>
  db.transactions.findAll({
    where: {
      sentAt: {
        $ne: null,
      },
      completedAt: null,
    },
    limit,
  })

module.exports = {
  getTransaction,
  createTransaction,
  getPendingTransactions,
  getUnhandledSentTransactions,
}

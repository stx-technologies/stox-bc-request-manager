const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {db} = require('../context')

const createTransaction = ({id, type, from}) => db.transactions.create({id, type, from})

const getTransactionById = id => db.transactions.findOne({where: {id}})

const createTransactions = (transactions, sequelizeTransaction) =>
  db.transactions.bulkCreate(transactions, {transaction: sequelizeTransaction})

const getUnsentTransactions = () => db.transactions.findAll({where: {sentAt: null}})

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
  getTransactionById,
  createTransaction,
  createTransactions,
  getUnsentTransactions,
  getUnhandledSentTransactions,
}

const {db} = require('../context')

const createTransaction = ({id, type, from}) => db.transactions.create({id, type, from})

const getTransactionById = id => db.transactions.findOne({where: {id}})

const createTransactions = (transactionsToAdd, transaction) => db.transactions.bulkCreate(transactionsToAdd, {transaction})

const getUnsentTransactions = () => db.transactions.findAll({where: {sentAt: null}})

module.exports = {
  getTransactionById,
  createTransaction,
  createTransactions,
  getUnsentTransactions,
}

const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {db} = require('../context')

const createTransaction = ({id, type, from}) => db.transactions.create({id, type, from})

const getTransactionById = id => db.transactions.findOne({where: {id}})

const createTransactions = async (transactions, requestId) => {
  const transaction = await db.sequelize.transaction()

  try {
    await db.transactions.bulkCreate(transactions)
    await db.requests.update({sentAt: Date.now()}, {where: {id: requestId}}, {transaction})
    await transaction.commit()
  } catch (e) {
    transaction.rollback()
    throw new UnexpectedError(e)
  }
}

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

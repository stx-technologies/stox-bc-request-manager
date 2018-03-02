const {Op} = require('sequelize')

module.exports = (db) => {
  const createTransaction = ({id, type, from}) =>
    db.transactions.create({
      id,
      type,
      from,
    })

  const getTransactionById = id =>
    db.transactions.findOne({
      where: {id},
    })

  const createRequest = ({id, type, data}) =>
    db.requests.create({
      id,
      type,
      data,
    })

  const getRequestById = id =>
    db.requests.findOne({
      where: {id},
    })

  const countRequestByType = async type => ({
    count: await db.requests.count({
      where: {type},
    }),
  })

  const getRequestByTransactionId = async (transactionId) => {
    const {requestId} = await getTransactionById(transactionId)
    return getRequestById(requestId)
  }

  const getAllUnsentFromTable = (table, transaction) =>
    table.findAll({where: {sentAt: null}}, {transaction}).then(values => values.map(({dataValues}) => dataValues))

  const updateSentRecords = (table, ids, transaction) =>
    table.update({sentAt: Date.now()}, {where: {id: {[Op.in]: ids}}}, {transaction})

  return {
    createRequest,
    countRequestByType,
    getRequestById,
    getTransactionById,
    getRequestByTransactionId,
    createTransaction,
    getAllUnsentFromTable,
    updateSentRecords,
  }
}

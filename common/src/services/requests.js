module.exports = (db) => {
  const createTransaction = ({id, type, from}) =>
    this.db.transactions.create({
      id,
      type,
      from,
    })

  const getTransactionById = id =>
    this.db.transactions.findOne({
      where: {id},
    })

  const createRequest = ({id, type, requestData}) =>
    this.db.requests.create({
      id,
      type,
      requestData,
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
    const transaction = await getTransactionById(transactionId)
    return getRequestById(transaction.requestId)
  }

  return {
    createRequest,
    countRequestByType,
    getRequestById,
    getTransactionById,
    getRequestByTransactionId,
    createTransaction,
  }
}

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

  const createRequest = ({id, type, requestData}) =>
    db.requests.create({
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
    const {requestId} = await getTransactionById(transactionId)
    return getRequestById(requestId)
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

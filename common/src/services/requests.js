const {db} = require('../context')
const {getTransactionById} = require('./transactions')

const createRequest = ({id, type, data}) => db.requests.create({id, type, data})

const getRequestById = id => db.requests.findOne({where: {id}})

const countRequestByType = async type => ({
  count: await db.requests.count({where: {type}}),
})

const getUnsentRequests = () => db.requests.findAll({where: {sentAt: null}})

const getRequestByTransactionId = async (transactionId) => {
  const {requestId} = await getTransactionById(transactionId)
  return getRequestById(requestId)
}


module.exports = {
  createRequest,
  countRequestByType,
  getRequestById,
  getTransactionById,
  getRequestByTransactionId,
  getUnsentRequests,
}

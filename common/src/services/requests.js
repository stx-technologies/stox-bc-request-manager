const {db} = require('../context')
const {getTransactionById} = require('./transactions')
const {Op} = require('sequelize')

const getRequestById = async (id, full) => {
  const request = await db.requests.findOne({where: {id}})
  if (full) {
    request.dataValues.transations = await request.getTransactions()
  }
  return request.dataValues
}

const getRequestByTransactionHash = async (transactionHash) => {
  const {requestId} = await db.transations.findOne({where: {transactionHash}})
  return getRequestById(requestId)
}

const updateRequest = (propsToUpdate, id, transaction) =>
  db.requests.update(propsToUpdate, {where: {id}}, {...(transaction ? {transaction} : {})})

const createRequest = ({id, type, data}) => db.requests.create({id, type, data, createdAt: new Date()})

const updateErrorRequest = async (id, error) => updateRequest({error}, id)

const countRequestByType = async (type, onlyPending) => ({
  count: await db.requests.count({where: {type, ...(onlyPending ? {transactionPreparedAt: null, error: null} : {})}}),
})

const getPendingRequests = limit => db.requests.findAll({where: {transactionPreparedAt: null, error: null}, limit})

const getRequestByTransactionId = async (transactionId) => {
  const {requestId} = await getTransactionById(transactionId)
  return getRequestById(requestId)
}

const getCorrespondingRequests = async transations =>
  db.requests.findAll({
    where: {
      id: {[Op.in]: transations.map(({requestId}) => requestId)},
    },
  })

module.exports = {
  createRequest,
  updateRequest,
  countRequestByType,
  getRequestById,
  getRequestByTransactionHash,
  getTransactionById,
  getRequestByTransactionId,
  getPendingRequests,
  getCorrespondingRequests,
  updateErrorRequest,
}

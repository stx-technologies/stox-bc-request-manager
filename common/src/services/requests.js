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

const updateRequest = (propsToUpdate, id, transaction) =>
  db.requests.update(propsToUpdate, {where: {id}}, {...(transaction ? {transaction} : {})})

const createRequest = ({id, type, data}) => db.requests.create({id, type, data, createdAt: new Date()})

const updateErrorRequest = async (id, error) => updateRequest({error, errorAt: new Date()}, id)

const countRequestByType = async (type, onlyPending) => ({
  count: await db.requests.count({where: {type, ...(onlyPending ? {sentAt: null, error: null} : {})}}),
})

const getPendingRequests = limit => db.requests.findAll({where: {sentAt: null, error: null}, limit})

const getRequestByTransactionId = async (transactionId) => {
  const {requestId} = await getTransactionById(transactionId)
  return getRequestById(requestId)
}

const getCorrespandingRequests = async transations =>
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
  getTransactionById,
  getRequestByTransactionId,
  getPendingRequests,
  getCorrespandingRequests,
  updateErrorRequest,
}

const {db, mq} = require('../context')
const {getTransaction} = require('./transactions')
const {Op} = require('sequelize')
const {exceptions: {NotFoundError}} = require('@welldone-software/node-toolbelt')
const {kebabCase} = require('lodash')

const getRequestById = async (id, full) => {
  const request = await db.requests.findOne({where: {id}})
  if (!request) {
    throw new NotFoundError('requestNotFound', {id})
  }
  if (full) {
    request.dataValues.transactions = await request.getTransactions()
  }
  return request.dataValues
}

const getRequestByTransactionHash = async (transactionHash) => {
  const {requestId} = await getTransaction({transactionHash})
  return getRequestById(requestId)
}

const updateRequest = (propsToUpdate, id, transaction) =>
  db.requests.update(propsToUpdate, {where: {id}}, {...(transaction ? {transaction} : {})})

const createRequest = ({id, type, data}) => db.requests.create({id, type, data, createdAt: new Date()})

const updateRequestCompleted = async (id, error = null) => updateRequest({error, completedAt: Date.now()}, id)

const countRequestByType = async (type, onlyPending) => ({
  count: await db.requests.count({where: {type, ...(onlyPending ? {transactionPreparedAt: null, error: null} : {})}}),
})

const getPendingRequests = limit => db.requests.findAll({where: {transactionPreparedAt: null, error: null}, limit})

const getRequestByTransactionId = async (transactionId) => {
  const {requestId} = await getTransaction({id: transactionId})
  return getRequestById(requestId)
}

const getCorrespondingRequests = async transactions =>
  db.requests.findAll({
    where: {
      id: {[Op.in]: transactions.map(({requestId}) => requestId)},
    },
  })

const publishCompletedRequest = async (request) => {
  request.transactions = request.transactions.map((transaction) => {
    transaction.transactionData = undefined
    return transaction
  })

  mq.publish(`completed-${kebabCase(request.type)}-requests`, {...request})
}

module.exports = {
  createRequest,
  updateRequest,
  countRequestByType,
  getRequestById,
  getRequestByTransactionHash,
  getRequestByTransactionId,
  getPendingRequests,
  getCorrespondingRequests,
  updateRequestCompleted,
  publishCompletedRequest,
}

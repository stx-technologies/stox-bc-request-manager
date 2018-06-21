const {db, mq} = require('../context')
const {getTransaction, updateTransactionError} = require('./transactions')
const {Op} = require('sequelize')
const {exceptions: {NotFoundError}} = require('@welldone-software/node-toolbelt')
const {kebabCase} = require('lodash')
const {errors: {errSerializer}} = require('stox-common')

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

const createRequest = ({id, type, priority, data}) =>
  db.requests.create({id, type, priority, data, createdAt: new Date()})

const updateRequestCompleted = async (id, error = null) =>
  updateRequest({error: errSerializer(error), completedAt: Date.now()}, id)

const countRequestByType = async type => ({
  count: await db.requests.count({where: {type}}),
})

const countPendingRequestByType = async type => ({
  count: await db.requests.count({where: {type, completedAt: null}}),
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
  const transactions = request.transactions &&
  request.transactions.map(transaction => ({...transaction.dataValues, transactionData: undefined}))

  mq.publish(`completed-${kebabCase(request.type)}-requests`, {...request, transactions})
}

const handleTransactionError = async ({id, requestId}, error) => {
  await updateRequestCompleted(requestId, error)
  await updateTransactionError(id, error)
  await publishCompletedRequest(await getRequestById(requestId, true))
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
  countPendingRequestByType,
  handleTransactionError,
}

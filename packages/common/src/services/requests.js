const {db, mq, config} = require('../context')
const {getTransaction, updateTransactionError} = require('./transactions')
const {Op} = require('sequelize')
const {loggers: {logger}, exceptions: {NotFoundError, InvalidStateError}} = require('@welldone-software/node-toolbelt')
const {kebabCase} = require('lodash')
const {errors: {errSerializer}} = require('stox-common')

const getRequestById = async (id, options) => {
  const request = options.withPriority ?
    await db.requests.findOne({where: {id}, include: {model: db.gasPercentiles}}) :
    await db.requests.findOne({where: {id}})

  if (!request) {
    throw new NotFoundError('requestNotFound', {id})
  }
  if (options.withTransactions) {
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


const createRequest = async ({id, type, priority, data}) => {
  if ((await db.gasPercentiles.count({where: {priority}})) === 0) {
    logger.warn(`no '${priority}' priority`)
    priority = config.defaultGasPriority
  }
  return db.requests.create({id, type, priority, data, createdAt: new Date()})
}

const increasePriority = async ({id, priority}) => {
  const request = await getRequestById(id, {withPriority: true})
  const currentPriority = request.gasPercentile
  const nextPriority = priority ?
    await db.gasPercentiles.findOne({where: {priority}}) :
    await db.gasPercentiles.findOne({
      where: {percentile: {$gt: currentPriority.percentile}},
      order: [['percentile']]})

  if (request.sentAt || request.completedAt) {
    throw new InvalidStateError('cant increase sent or completed requests')
  } else if (!nextPriority) {
    throw new InvalidStateError(priority ? `no '${priority}' priority` : 'maximum priority')
  } else if (nextPriority.priority === currentPriority.priority) {
    throw new InvalidStateError(`already in '${nextPriority.priority}' priority`)
  } else if (nextPriority.percentile < currentPriority.percentile) {
    throw new InvalidStateError(`priority: '${priority}' lower then current: '${currentPriority.priority}'`)
  }

  await db.requests.update(
    {priority: nextPriority.priority},
    {where: {id: request.id, priority: currentPriority.priority, sentAt: null, completedAt: null}}
  )

  return {
    oldPriority: currentPriority.priority,
    newPriority: nextPriority.priority,
  }
}

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

const failRequestTransaction = async ({id, requestId}, error) => {
  await updateRequestCompleted(requestId, error)
  await updateTransactionError(id, error)
  await publishCompletedRequest(await getRequestById(requestId, {withTransactions: true}))
}

module.exports = {
  createRequest,
  increasePriority,
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
  failRequestTransaction,
}

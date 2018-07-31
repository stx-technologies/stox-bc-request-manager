const {db, mq, config} = require('../context')
const {getTransaction, updateTransactionError, cancelTransaction} = require('./transactions')
const {Op} = require('sequelize')
const {loggers: {logger}, exceptions: {NotFoundError, InvalidStateError}} = require('@welldone-software/node-toolbelt')
const {camelCase, kebabCase} = require('lodash')
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
  db.requests.update(propsToUpdate, {where: {id}, ...(transaction ? {transaction} : {})})


const createRequest = async ({id, type, priority, data}) => {
  if ((await db.gasPercentiles.count({where: {priority}})) === 0) {
    if (priority) {
      logger.warn(`no '${priority}' priority`)
    }
    priority = config.defaultGasPriority
  }
  type = camelCase(type)
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

const publishCompletedRequest = async (request) => {
  const type = kebabCase(request.type)
  const transactions = request.transactions &&
    request.transactions.map(transaction => ({...transaction.dataValues, transactionData: undefined}))

  mq.publish(`completed-${type}-requests`, {...request, type, transactions})
}

const updateRequestCompleted = async (id, error = null) => {
  const request = await getRequestById(id, {withTransactions: true})
  if (!request.completedAt) {
    await updateRequest({error: errSerializer(error), completedAt: Date.now()}, id)
    publishCompletedRequest(request)
  }
}

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


const failRequestTransaction = async ({id, requestId}, error) => {
  await updateTransactionError(id, error)
  await updateRequestCompleted(requestId, error)
}

const validateRequestBeforeCanceled = (request) => {
  const throwError = (msg) => {
    throw new InvalidStateError(msg)
  }
  return request.error ? throwError('requestError')
    : request.completedAt ? throwError('requestCompleted')
      : request.canceledAt ? throwError('requestCanceled') : true
}


const cancelRequest = async (requestId, transactionHash) => {
  const id = requestId || (await getTransaction({transactionHash})).requestId
  const request = await getRequestById(id)
  validateRequestBeforeCanceled(request)
  const dbTransaction = await db.sequelize.transaction()
  try {
    request.update({canceledAt: new Date()}, {transaction: dbTransaction})
    const transactions = await request.getTransactions({where: {resentAt: null}})
    await Promise.all(transactions.map(transaction => cancelTransaction(transaction, dbTransaction)))
    if (!request.sentAt) {
      const isUpdated = await db.requests.update(
        {error: errSerializer('requestCanceled'), completedAt: Date.now()},
        {where: {id, sentAt: null}, transaction: dbTransaction}
      )
      if (!isUpdated[0]) {
        throw new InvalidStateError('transaction already sent')
      }
      await publishCompletedRequest(request)
    }
    await dbTransaction.commit()
  } catch (e) {
    await dbTransaction.rollback
    throw e
  }
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
  cancelRequest,
}

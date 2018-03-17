const {db} = require('../context')
const {getTransactionById} = require('./transactions')
const {Op} = require('sequelize')

const createRequest = ({id, type, data}) => db.requests.create({id, type, data, createdAt: new Date()})

const createOrUpdateErrorRequest = ({id, type, data}, error) => {
  const request = getRequestById(id)
  const errorData = {error, errorAt: new Date()}
  if (request) {
    updateRequest(errorData, id)
  } else {
    db.requests.create({...errorData, id, type, data, createdAt: new Date()})
  }
}

const updateRequest = (propsToUpdate, id, transaction) =>
  db.requests.update(propsToUpdate, {where: {id}}, {...(transaction ? {transaction} : {})})

const getRequestById = id => db.requests.findOne({where: {id}})

const countRequestByType = async (type, onlyPending) => ({
  count: await db.requests.count({where: {type, ...(onlyPending ? {sentAt: null, error: null} : {})}}),
})

const getPendingRequests = limit => db.requests.findAll({where: {sentAt: null, error: null}, limit})

const getErrorRequests = (limit, props) => db.requests.findAll({where: {...props, error: {$ne: null}}, limit})

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

const deleteById = (id, transaction) => db.requests.destroy({where: {id}}, {transaction})

module.exports = {
  createRequest,
  updateRequest,
  countRequestByType,
  getRequestById,
  getTransactionById,
  getRequestByTransactionId,
  getPendingRequests,
  getCorrespandingRequests,
  createOrUpdateErrorRequest,
  getErrorRequests,
  deleteById,
}

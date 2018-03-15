const {db} = require('../context')
const {getTransactionById} = require('./transactions')
const {Op} = require('sequelize')

const createRequest = ({id, type, data}) => db.requests.create({id, type, data, createdAt: new Date()})

const updateRequest = (propsToUpdate, id, transaction) =>
  db.requests.update(propsToUpdate, {where: {id}}, {...transaction ? {transaction} : {}})

const getRequestById = id => db.requests.findOne({where: {id}})

const countRequestByType = async (type, onlyPending) => ({
  count: await db.requests.count({where: {type, ...onlyPending ? {sentAt: null, error: null} : {}} }),
})

const getPendingRequests = () => db.requests.findAll({where: {sentAt: null, error: null}})

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
}

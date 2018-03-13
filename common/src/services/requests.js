const {db} = require('../context')
const {getTransactionById} = require('./transactions')
const {Op} = require('sequelize')

const createRequest = ({id, type, data}) => db.requests.create({id, type, data, createdAt: new Date()})

const getRequestById = id => db.requests.findOne({where: {id}})

const countRequestByType = async type => ({
  count: await db.requests.count({where: {type}}),
})

const getPendingRequests = () => db.requests.findAll({where: {sentAt: null}})

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
  countRequestByType,
  getRequestById,
  getTransactionById,
  getRequestByTransactionId,
  getPendingRequests,
  getCorrespandingRequests,
}

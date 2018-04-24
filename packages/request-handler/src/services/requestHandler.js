const {services: {requests, transactions}} = require('stox-bc-request-manager-common')
const requireAll = require('require-all')
const path = require('path')

const plugins = requireAll(path.resolve(__dirname, '../plugins'))

const prepareTransactions = async (request) => {
  const {type} = request
  return plugins[type].prepareTransactions(request)
}

const createRequestTransactions = async (request) => {
  const {id} = request
  try {
    const pendingTransactions = await prepareTransactions(request)
    await transactions.addTransactions(request.id, pendingTransactions)
  } catch (error) {
    await requests.updateRequestCompleted(id, error)
    throw error
  }
}

const handleRequest = request => createRequestTransactions(request)

module.exports = {
  prepareTransactions,
  createRequestTransactions,
  handleRequest,
}

const {services: {requests, transactions}} = require('stox-bc-request-manager-common')
const requireAll = require('require-all')
const path = require('path')

const plugins = requireAll(path.resolve(__dirname, '../plugins'))

const prepareTransactions = async (request) => {
  const {type} = request
  return plugins[type].prepareTransactions(request)
}

const createRequestTransactions = async (request) => {
  try {
    const preparedTransactions = await prepareTransactions(request)
    await transactions.addTransactions(request.id, preparedTransactions)
  } catch (error) {
    await requests.updateErrorRequest(request.id, error.message)
  }
}

const handleRequest = request => createRequestTransactions(request)

module.exports = {
  prepareTransactions,
  createRequestTransactions,
  handleRequest,
}

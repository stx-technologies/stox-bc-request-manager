const {services: {transactions}} = require('stox-bc-request-manager-common')
const requireAll = require('require-all')
const path = require('path')

const plugins = requireAll(path.resolve(__dirname, '../plugins'))

const prepareTransactions = async (request) => {
  const {type} = request
  return plugins[type].prepareTransactions(request)
}

const createRequestTransactions = async (request) => {
  const pendingTransactions = await prepareTransactions(request)
  await transactions.addTransactions(request.id, pendingTransactions)
}

const handleRequest = request => createRequestTransactions(request)

module.exports = {
  prepareTransactions,
  createRequestTransactions,
  handleRequest,
}

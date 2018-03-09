const models = require('./db/models')
const utils = require('./utils')
const context = require('./context')
const requireAll = require('require-all')
const path = require('path')

const services = requireAll(path.resolve(__dirname, 'services'))

const initContext = (ctx) => {
  Object.keys(ctx).forEach(prop => Object.assign(context[prop], ctx[prop]))
}

module.exports = {
  models,
  services,
  utils,
  initContext,
  context,
}

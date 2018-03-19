const models = require('./db/models')
const utils = require('./utils')
const context = require('./context')
const requireAll = require('require-all')
const path = require('path')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createServiceFromFileStructure} = require('stox-common')

const services = requireAll(path.resolve(__dirname, 'services'))

const initContext = (ctx) => {
  Object.keys(ctx).forEach((prop) => {
    if (prop in context) {
      Object.assign(context[prop], ctx[prop])
    } else {
      context[prop] = ctx[prop]
    }
  })
}

const start = async (dirname, config) => {
  try {
    const ctx = await createServiceFromFileStructure(dirname)
    initContext({...ctx, config})
    context.logger = ctx.logger
  } catch (e) {
    logger.error(e)
  }
}

module.exports = {
  models,
  services,
  utils,
  context,
  start,
  initContext,
}

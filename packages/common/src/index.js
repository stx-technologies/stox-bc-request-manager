const models = require('./db/models')
const utils = require('./utils')
const context = require('./context')
const requireAll = require('require-all')
const path = require('path')
const {loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService, createServiceFromFileStructure, initContext} = require('stox-common')

const services = requireAll({
  dirname: path.resolve(__dirname, 'services'),
  filter: /(.*)\.js$/,
})

const start = async (dirname, config) => {
  try {
    const ctx = await createServiceFromFileStructure(dirname)
    initContext({...ctx, config}, context)
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
  createService,
}

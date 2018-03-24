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


//PATCH because even though dependency, it cannot connect, TODO: retry mechanism at common
const start = async (dirname, config) =>
  new Promise((resolve, reject) =>
    setTimeout(async () => {
      try {
        const ctx = await createServiceFromFileStructure(dirname)
        initContext({...ctx, config}, context)
        context.logger = ctx.logger
        resolve()
      } catch (e) {
        logger.error(e)
        reject(e)
      }
    }, 3000)
  )


module.exports = {
  models,
  services,
  utils,
  context,
  start,
  initContext,
  createService,
}

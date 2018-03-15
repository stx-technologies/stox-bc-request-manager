const {Op} = require('sequelize')
const {snakeCase} = require('lodash')

const updateSentRecords = (table, ids, transaction) =>
  table.update({sentAt: Date.now()}, {where: {id: {[Op.in]: ids}}}, {transaction})

const loggerFormatText = text => snakeCase(text).toUpperCase()

module.exports = {
  updateSentRecords,
  loggerFormatText,
}

const {db} = require('../context')
const {Op} = require('sequelize')

const updateSentRecords = (table, ids, transaction) =>
  table.update({sentAt: Date.now()}, {where: {id: {[Op.in]: ids}}}, {transaction})

module.exports = {
  updateSentRecords,
}

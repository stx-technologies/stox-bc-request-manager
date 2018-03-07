const {db} = require('../context')
const {Op} = require('sequelize')

const nounceFromAccountNounces = async (address, network, transaction) => {
  const accountNounce = await db.accountNounces.findOne({where: {address, network}}, {transaction})
  return accountNounce ? accountNounce.nounce : 0
}

const updateSentRecords = (table, ids, transaction) =>
  table.update({sentAt: Date.now()}, {where: {id: {[Op.in]: ids}}}, {transaction})

module.exports = {
  updateSentRecords,
  nounceFromAccountNounces,
}

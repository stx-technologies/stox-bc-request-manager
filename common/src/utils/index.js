const {Op} = require('sequelize')

const nounceFromAccountNounces = async (address, network, transaction) => {
    const accountNounce = await table.findOne({where: {address, network}}, {transaction})
    return accountNounce ? accountNounce.nounce : 0
}

const getAllUnsentFromTable = (table, transaction) =>
    table.findAll({where: {sentAt: null}}, {transaction}).then(values => values.map(({dataValues}) => dataValues))

const updateSentRecords = (table, ids, transaction) =>
    table.update({sentAt: Date.now()}, {where: {id: {[Op.in]: ids}}}, {transaction})

module.exports = {
    getAllUnsentFromTable,
    updateSentRecords,
}

const {db} = require('../context')

const nounceFromAccountNounces = async (address, network, transaction) => {
  const accountNounce = await db.accountNounces.findOne({where: {address, network}}, {transaction})
  return accountNounce ? accountNounce.nounce : 0
}

const findOrCreateAccountNounce = (from, network, transaction) =>
  db.accountNounces.findOrCreate({where: {account: from, network}}, {transaction})

module.exports = {
  nounceFromAccountNounces,
  findOrCreateAccountNounce,
}

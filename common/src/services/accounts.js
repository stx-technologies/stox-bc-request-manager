const {db} = require('../context')

const nounceFromAccountNounces = async (account, network, transaction) => {
  const accountNounce = await db.accountNounces.findOne({where: {account, network}}, {transaction})

  return accountNounce ? accountNounce.nounce : 0
}

const findOrCreateAccountNounce = (account, network, transaction) =>
  new Promise((resolve, reject) =>
    db.accountNounces.findOrCreate({where: {account, network}, transaction}).spread(res => resolve(res)))

module.exports = {
  nounceFromAccountNounces,
  findOrCreateAccountNounce,
}

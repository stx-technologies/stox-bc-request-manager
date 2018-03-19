const {db} = require('../context')

const fetchNextAccountNonce = async (account, network, transaction) => {
  const accountNonce = await db.accountNonces.findOne({where: {account, network}}, {transaction})

  return accountNonce ? accountNonce.nonce : 0
}

const findOrCreateAccountNonce = (account, network, transaction) =>
  new Promise(resolve =>
    db.accountNonces.findOrCreate({where: {account, network}, transaction}).spread(res => resolve(res)))

module.exports = {
  fetchNextAccountNonce,
  findOrCreateAccountNonce,
}

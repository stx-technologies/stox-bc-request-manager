const {db, blockchain} = require('../context')
const {Big} = require('big.js')

const fetchNextAccountNonce = async (account, network) => {
  const accountNonce = await db.accountNonces.findOne({where: {account, network}})
  return accountNonce ? accountNonce.nonce : 0
}

const findOrCreateAccountNonce = (account, network, transaction) =>
  new Promise(resolve =>
    db.accountNonces.findOrCreate({where: {account, network}, transaction}).spread(res => resolve(res)))

const fetchNonceFromEtherNode = async fromAccount =>
  blockchain.web3.eth.getTransactionCount(fromAccount, 'pending')

const fetchBestNonce = async ({from, network}) => {
  const nonceFromEtherNode = await fetchNonceFromEtherNode(from)
  const nonceFromDB = await fetchNextAccountNonce(from, network)
  const bestNonce = Big(nonceFromDB).gt(nonceFromEtherNode) ? nonceFromDB : nonceFromEtherNode
  return Big(bestNonce).toFixed()
}

const incrementAccountNonce = async ({from, network}, nonce, dbTransaction) => {
  const accountNonce = await findOrCreateAccountNonce(from, network, dbTransaction)
  await accountNonce.update({nonce: Big(nonce).plus(1).toFixed()}, {transaction: dbTransaction})
}

module.exports = {
  fetchBestNonce,
  incrementAccountNonce,
}

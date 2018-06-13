const {Big} = require('big.js')
const {logger, db, blockchain} = require('../context')
const {isResendTransaction} = require('./transactions')

const fetchNextAccountNonce = async (account, network) => {
  const accountNonce = await db.accountNonces.findOne({where: {account, network}})

  return accountNonce ? accountNonce.nonce : 0
}

const findOrCreateAccountNonce = (account, network, transaction) =>
  new Promise(resolve =>
    db.accountNonces.findOrCreate({where: {account, network}, transaction}).spread(res => resolve(res)))

const fetchNonceFromEtherNode = async fromAccount => blockchain.web3.eth.getTransactionCount(fromAccount, 'pending')

const fetchBestNonce = async (transaction) => {
  let bestNonce
  if (isResendTransaction(transaction.dataValues)) {
    bestNonce = transaction.nonce
  } else {
    const {from, network} = transaction
    const nonceFromEtherNode = await fetchNonceFromEtherNode(from)
    const nonceFromDB = await fetchNextAccountNonce(from, network)

    if (Big(nonceFromDB).lt(nonceFromEtherNode)) {
      logger.warn({account: from, nonceFromEtherNode, nonceFromDB}, 'NONCE_NOT_SYNCED')
    }
    bestNonce = (Big(nonceFromDB).gt(nonceFromEtherNode) ? nonceFromDB : nonceFromEtherNode)
  }

  return Big(bestNonce).toFixed()
}

module.exports = {
  findOrCreateAccountNonce,
  fetchBestNonce,
}

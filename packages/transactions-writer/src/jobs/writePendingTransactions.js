const {exceptions: {UnexpectedError}} = require('@welldone-software/node-toolbelt')
const {writePendingTransactionsCron, transactionsSignerBaseUrl} = require('../config')
const {http,
  utils: {promise: {promiseSerial}},
} = require('stox-common')

const {
  services: {
    accounts: {fetchNextAccountNonce, findOrCreateAccountNonce},
    requests,
    transactions: {getPendingTransactions},
  },
  context,
  context: {db, blockchain},
} = require('stox-bc-request-manager-common')

const {web3} = blockchain
const clientHttp = http(transactionsSignerBaseUrl)

const fetchNonceFromEtherNode = async fromAccount =>
  web3.eth.getTransactionCount(fromAccount)

const isEtherNodeNonceSynced = async ({from, network}, dbTransaction) => {
  const nonceFromEtherNode = await fetchNonceFromEtherNode(from)
  const nonceFromAccountNonce = await fetchNextAccountNonce(from, network, dbTransaction)
  return [nonceFromAccountNonce >= nonceFromEtherNode, nonceFromEtherNode, nonceFromAccountNonce]
}

const fetchGasPriceFromGasCalculator = async () => '5000000000' // 5 Gwei

const signTransactionInTransactionSigner = async (from, unsignedTransaction, transactionId) => {
  const signedTransaction = await clientHttp.post('/transactions/sign', {from, unsignedTransaction, transactionId})
  context.logger.info({from, unsignedTransaction, signedTransaction, transactionId}, 'TRANSACTION_SIGNED')
  return signedTransaction
}

const sendTransactionToBlockchain = async signedTransaction => new Promise(((resolve) => {
  web3.eth.sendSignedTransaction(signedTransaction)
    .once('transactionHash', (hash) => {
      context.logger.info({hash}, 'TRANSACTION_SENT')
      resolve(hash)
    })
    .on('error', (error) => {
      throw new UnexpectedError(error)
    })
}))

const updateTransaction = async (transaction, unsignedTransaction, transactionHash, dbTransaction) => {
  await transaction.update(
    {
      // f.ii
      transactionHash,
      gasPrice: unsignedTransaction.gasPrice,
      nonce: unsignedTransaction.nonce,
      sentAt: Date.now(),
    },
    {transaction: dbTransaction}
  )
}

const updateRequest = async ({requestId}, dbTransaction) => {
  const request = await requests.getRequestById(requestId)
  await request.update({sentAt: Date.now()}, {transaction: dbTransaction}) // f.iii
}

const updateAccountNonce = async ({from, network}, nonce, dbTransaction) => {
  // f.iv
  const accountNonce = await findOrCreateAccountNonce(from, network, dbTransaction)
  await accountNonce.update({nonce}, {transaction: dbTransaction})
}

module.exports = {
  cron: writePendingTransactionsCron,
  job: async () => {
    const pendingTransactions = await getPendingTransactions() // d.i
    const dbTransaction = await db.sequelize.transaction()
    const promises = pendingTransactions.map(async (transaction) => {
      const [isNonceSynced, nodeNonce, dbNonce] = await isEtherNodeNonceSynced(transaction, dbTransaction)

      if (isNonceSynced) {
        // d.ii-iv
        context.logger.warn({transaction, nodeNonce, dbNonce}, 'NONCE_NOT_SYNCED')
        return
      }

      const unsignedTransaction = {
        nonce: nodeNonce,
        to: transaction.to,
        data: transaction.transactionData,
        gasPrice: await fetchGasPriceFromGasCalculator(),
        chainId: await web3.eth.net.getId(),
      }
      unsignedTransaction.gasLimit = await web3.eth.estimateGas(transaction.from, unsignedTransaction)

      const signedTransaction =
        await signTransactionInTransactionSigner(transaction.from, unsignedTransaction, transaction.id)
      const transactionHash = await sendTransactionToBlockchain(signedTransaction)

      await updateTransaction(transaction, unsignedTransaction, transactionHash, dbTransaction)
      await updateRequest(transaction, dbTransaction)
      await updateAccountNonce(transaction, nodeNonce, dbTransaction)

      context.logger.info({transaction}, 'SUCCESSFULLY_UPDATED_TRANSACTION')
    })

    try {
      await promiseSerial(promises)
      await dbTransaction.commit()
    } catch (e) {
      dbTransaction.rollback()
      throw new UnexpectedError(e)
    }
  },
}

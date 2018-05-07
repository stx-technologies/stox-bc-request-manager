const {
  writePendingTransactionsCron,
  transactionsSignerBaseUrl,
  limitTransactions,
  defaultGasPrice,
} = require('../config')
const {http, errors: {logError}} = require('stox-common')
const promiseSerial = require('promise-serial')
const {
  services: {
    accounts: {fetchNextAccountNonce, findOrCreateAccountNonce},
    requests,
    transactions: {getPendingTransactions},
  },
  context,
  context: {db, blockchain},
} = require('stox-bc-request-manager-common')

const clientHttp = http(transactionsSignerBaseUrl)

const fetchNonceFromEtherNode = async fromAccount => blockchain.web3.eth.getTransactionCount(fromAccount)

const isEtherNodeNonceSynced = async ({from, network}, dbTransaction) => {
  try {
    const nonceFromEtherNode = await fetchNonceFromEtherNode(from)
    const nonceFromDB = await fetchNextAccountNonce(from, network, dbTransaction)
    return [nonceFromDB <= nonceFromEtherNode, nonceFromEtherNode, nonceFromDB]
  } catch (e) {
    context.logger.error(e, 'ERROR_FETCHING_NONCE')
    return false
  }
}

const fetchGasPriceFromGasCalculator = async () => parseInt(defaultGasPrice, 10)

const signTransactionInTransactionSigner = async (fromAddress, unsignedTransaction, transactionId) => {
  const signedTransaction = await clientHttp.post('/transactions/sign', {
    fromAddress,
    unsignedTransaction,
    transactionId,
  })
  context.logger.info({fromAddress, unsignedTransaction, signedTransaction, transactionId}, 'TRANSACTION_SIGNED')
  return signedTransaction
}

const sendTransactionToBlockchain = async signedTransaction =>
  new Promise((resolve, reject) => {
    blockchain.web3.eth
      .sendSignedTransaction(signedTransaction)
      .once('transactionHash', (hash) => {
        context.logger.info({hash}, 'TRANSACTION_SENT')
        resolve(hash)
      })
      .on('error', (error) => {
        reject(error)
      })
  })

const updateTransaction = async (transaction, unsignedTransaction, transactionHash, dbTransaction) => {
  await transaction.update(
    {
      transactionHash,
      gasPrice: unsignedTransaction.gasPrice,
      nonce: unsignedTransaction.nonce,
      sentAt: Date.now(),
    },
    {transaction: dbTransaction}
  )
}

const updateRequest = async ({requestId}, dbTransaction) =>
  requests.updateRequest({sentAt: Date.now()}, requestId, dbTransaction)

const updateAccountNonce = async ({from, network}, nonce, dbTransaction) => {
  const accountNonce = await findOrCreateAccountNonce(from, network, dbTransaction)
  await accountNonce.update({nonce}, {transaction: dbTransaction})
}

module.exports = {
  cron: writePendingTransactionsCron,
  job: async () => {
    const pendingTransactions = await getPendingTransactions(limitTransactions)
    const promises = pendingTransactions.map(transaction => async () => {
      const dbTransaction = await db.sequelize.transaction()
      try {
        const [isNonceSynced, nodeNonce, dbNonce] = await isEtherNodeNonceSynced(transaction, dbTransaction)

        if (!isNonceSynced) {
          context.logger.warn({transactionId: transaction.id, nodeNonce, dbNonce}, 'NONCE_NOT_SYNCED')
          return
        }

        const unsignedTransaction = {
          nonce: nodeNonce,
          to: transaction.to,
          data: transaction.transactionData.toString(),
          gasPrice: await fetchGasPriceFromGasCalculator(),
          chainId: await blockchain.web3.eth.net.getId(),
        }

        unsignedTransaction.gasLimit = await blockchain.web3.eth.estimateGas({
          from: transaction.from,
          to: unsignedTransaction.to,
          gasPrice: unsignedTransaction.gasPrice,
          nonce: unsignedTransaction.nonce,
          data: unsignedTransaction.data,
        })

        const fromAccountBalance = await blockchain.web3.eth.getBalance(transaction.from)
        const requiredBalance = unsignedTransaction.gasLimit * unsignedTransaction.gasPrice
        if (fromAccountBalance < requiredBalance) {
          context.logger.error(
            {
              requestId: transaction.requestId,
              transactionId: transaction.id,
              fromAccount: transaction.from,
              fromAccountBalance,
              requiredBalance,
            },
            'INSUFFICIENT_FUNDS_FOR_TRANSACTION'
          )
          return
        }

        const signedTransaction = await signTransactionInTransactionSigner(
          transaction.from,
          unsignedTransaction,
          transaction.id
        )
        const transactionHash = await sendTransactionToBlockchain(signedTransaction)

        await updateTransaction(transaction, unsignedTransaction, transactionHash, dbTransaction)
        await updateRequest(transaction, dbTransaction)
        await updateAccountNonce(transaction, nodeNonce, dbTransaction)

        context.logger.info(
          {
            id: transaction.id,
            transactionHash: transaction.transactionHash,
          },
          'SUCCESSFULLY_UPDATED_TRANSACTION'
        )
        await dbTransaction.commit()
      } catch (e) {
        dbTransaction.rollback()
        logError(e, 'TRANSACTION_FAILED')
        await requests.handleTransactionError(transaction, e)
      }
    })
    await promiseSerial(promises)
  },
}

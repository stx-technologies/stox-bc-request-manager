const {
  writePendingTransactionsCron,
  transactionsSignerBaseUrl,
  limitTransactions,
  defaultGasPrice,
  maximumGasPrice,
} = require('../config')
const {http, errors: {logError}} = require('stox-common')
const promiseSerial = require('promise-serial')
const {
  services: {
    accounts: {fetchNextAccountNonce, findOrCreateAccountNonce},
    requests,
    transactions: {getPendingTransactions},
    gasPrices: {getGasPriceByPriority},
  },
  context,
  context: {db, blockchain},
} = require('stox-bc-request-manager-common')

const clientHttp = http(transactionsSignerBaseUrl)

const fetchNonceFromEtherNode = async fromAccount => blockchain.web3.eth.getTransactionCount(fromAccount, 'pending')

const fetchBestNonce = async ({from, network}) => {
  const nonceFromEtherNode = await fetchNonceFromEtherNode(from)
  const nonceFromDB = await fetchNextAccountNonce(from, network)

  if (nonceFromDB < nonceFromEtherNode) {
    context.logger.warn({account: from, nonceFromEtherNode, nonceFromDB}, 'NONCE_NOT_SYNCED')
  }

  return (nonceFromDB > nonceFromEtherNode ? nonceFromDB : nonceFromEtherNode)
}

const fetchGasPriceFromGasCalculator = async (priority) => {
  const gasPrice = await getGasPriceByPriority(priority)
  return gasPrice || parseInt(defaultGasPrice, 10)
}

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

const createUnsignedTransaction = async (nonce, transaction, request) => {
  const unsignedTransaction = {
    nonce,
    to: transaction.to,
    data: transaction.transactionData.toString(),
    gasPrice: await fetchGasPriceFromGasCalculator(request.priority),
    chainId: await blockchain.web3.eth.net.getId(),
  }

  unsignedTransaction.gasLimit = await blockchain.web3.eth.estimateGas({
    from: transaction.from,
    to: unsignedTransaction.to,
    gasPrice: unsignedTransaction.gasPrice,
    nonce: unsignedTransaction.nonce,
    data: unsignedTransaction.data,
  })

  return unsignedTransaction
}

const commitTransaction = async (transaction, unsignedTransaction, transactionHash, transactionNonce) => {
  const dbTransaction = await db.sequelize.transaction()
  try {
    await updateTransaction(transaction, unsignedTransaction, transactionHash, dbTransaction)
    await updateRequest(transaction, dbTransaction)
    await updateAccountNonce(transaction, transactionNonce + 1, dbTransaction)

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
    throw (e)
  }
}

module.exports = {
  cron: writePendingTransactionsCron,
  job: async () => {
    const pendingTransactions = await getPendingTransactions(limitTransactions)
    const promises = pendingTransactions.map(transaction => async () => {
      try {
        const nonce = await fetchBestNonce(transaction)
        const request = await requests.getRequestById(transaction.requestId)


        const unsignedTransaction = await createUnsignedTransaction(nonce, transaction, request)
        if (unsignedTransaction.gasPrice > maximumGasPrice) {
          const lowGasPrice = await getGasPriceByPriority('low')
          context.logger.error(
            {
              currentGasPrice: unsignedTransaction.gasPrice,
              maximumGasPrice,
              lowGasPrice,
            },
            'GAS_PRICE_IS_TOO_HIGH'
          )
          if (maximumGasPrice > lowGasPrice) {
            unsignedTransaction.gasPrice = maximumGasPrice
          } else {
            return
          }
        }
        const fromAccountBalance = await blockchain.web3.eth.getBalance(transaction.from)
        const requiredBalance = unsignedTransaction.gasLimit * unsignedTransaction.gasPrice
        if (fromAccountBalance < requiredBalance) {
          context.logger.warning(
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
        await commitTransaction(transaction, unsignedTransaction, transactionHash, nonce)
      } catch (e) {
        logError(e, 'TRANSACTION_FAILED')
        await requests.handleTransactionError(transaction, e)
      }
    })
    await promiseSerial(promises)
  },
}

const {Big} = require('big.js')
const {
  writePendingTransactionsCron,
  transactionsSignerBaseUrl,
  limitTransactions,
  maximumGasPrice,
} = require('../config')
const {http, errors: {logError}} = require('stox-common')
const promiseSerial = require('promise-serial')
const {
  services: {
    accounts: {fetchBestNonce, incrementAccountNonce},
    requests,
    transactions: {getPendingTransactions, isResendTransaction, isSentWithGasPriceHigherThan, isAlreadyMined,
      isMinedTransactionInDb, updateTransactionError, getPendingTransactionsGasPrice},
    gasPrices: {isMaximumGasPriceGreaterThanLowest, getGasPriceForResend},
  },
  utils: {calculateGasCost},
  context,
  context: {db, blockchain},
} = require('stox-bc-request-manager-common')
const {exceptions: {InvalidArgumentError}} = require('@welldone-software/node-toolbelt')

const clientHttp = http(transactionsSignerBaseUrl)

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
      estimatedGas: unsignedTransaction.gasLimit,
      estimatedGasCost: calculateGasCost(unsignedTransaction),
      nonce: unsignedTransaction.nonce,
      sentAt: Date.now(),
    },
    {transaction: dbTransaction}
  )
}

const getGasPrice = async (transaction) => {
  if (!transaction.request.gasPercentile) {
    context.logger.error(
      {
        id: transaction.id,
        requestId: transaction.requestId,
        priority: transaction.request.priority,
      },
      'PRIORITY_DOES_NOT_EXIST'
    )
    return 0
  }

  const gasPrice = isResendTransaction(transaction) ?
    await getGasPriceForResend(transaction.gasPrice) :
    transaction.request.gasPercentile.price
  return parseInt(gasPrice, 10)
}

const createUnsignedTransaction = async (nonce, transaction) => {
  if (Number.isNaN(parseInt(nonce, 10))) {
    throw new InvalidArgumentError('invalidNonce', {nonce})
  }
  const unsignedTransaction = {
    nonce: Number(nonce),
    to: transaction.to,
    data: transaction.transactionData,
    gasPrice: await getGasPrice(transaction),
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
    await requests.updateRequest({sentAt: Date.now()}, transaction.requestId, dbTransaction)
    if (!isResendTransaction(transaction)) {
      await incrementAccountNonce(transaction, transactionNonce)
    }
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

const validateSufficientBalance = async (transaction, unsignedTransaction) => {
  const fromAccountBalance = await blockchain.web3.eth.getBalance(transaction.from)
  const requiredBalance = calculateGasCost(unsignedTransaction)
  const pendingTransactionsGasPrice = await getPendingTransactionsGasPrice(transaction.from)
  const haveSufficientBalance = isResendTransaction(transaction) ?
    Big(fromAccountBalance).gte(requiredBalance) :
    Big(fromAccountBalance).minus(pendingTransactionsGasPrice).gte(requiredBalance)

  if (!haveSufficientBalance) {
    context.logger.warn(
      {
        requestId: transaction.requestId,
        transactionId: transaction.id,
        fromAccount: transaction.from,
        pendingTransactionsGasPrice,
        fromAccountBalance,
        requiredBalance,
      },
      'INSUFFICIENT_FUNDS_FOR_TRANSACTION'
    )
    return false
  }
  return true
}

const validateGasPrice = async ({ignoreMaxGasPrice, originalTransactionId, from, nonce}, unsignedTransaction) => {
  if (!unsignedTransaction.gasPrice) {
    return false
  }

  if (!ignoreMaxGasPrice && Big(unsignedTransaction.gasPrice).gt(maximumGasPrice)) {
    if (await isMaximumGasPriceGreaterThanLowest()) {
      unsignedTransaction.gasPrice = parseInt(maximumGasPrice, 10)
    } else {
      context.logger.warn(
        {
          from,
          nonce,
          originalTransactionId,
          unsignedTransaction,
          gasPrice: unsignedTransaction.gasPrice,
          maximumGasPrice,
        },
        'MAXIMUM_GAS_PRICE_EXCEEDED'
      )
      return false
    }
  }

  const minimumAllowedGasPrice = Big(unsignedTransaction.gasPrice).div(1.1).round(0, 1).toString()
  if (isResendTransaction({originalTransactionId}) &&
   await isSentWithGasPriceHigherThan(from, nonce, minimumAllowedGasPrice)) {
    context.logger.warn(
      {
        from,
        nonce,
        originalTransactionId,
        unsignedTransaction,
        gasPrice: unsignedTransaction.gasPrice,
      },
      'ALREADY_SENT_WITH_HIGHER_GAS_PRICE'
    )
    return false
  }
  return true
}

const failMinedTransaction = async ({id, requestId, from, nonce}) => {
  if (await isMinedTransactionInDb({requestId, from, nonce})) {
    updateTransactionError(id, 'transaction already mined')
  } else {
    await requests.failRequestTransaction(
      {id, requestId},
      'transaction already mined but not from the system'
    )
  }
}

const validateBeforeSend = async (transaction, unsignedTransaction) => {
  if (!(await validateGasPrice(transaction, unsignedTransaction))) {
    return false
  }

  if (!(await validateSufficientBalance(transaction, unsignedTransaction))) {
    return false
  }

  if (isResendTransaction(transaction) && await isAlreadyMined(transaction)) {
    await failMinedTransaction(transaction)
    return false
  }
  return true
}


module.exports = {
  cron: writePendingTransactionsCron,
  job: async () => {
    const pendingTransactions = await getPendingTransactions(limitTransactions)
    const promises = pendingTransactions.map(transaction => async () => {
      try {
        const nonce = isResendTransaction(transaction) ? transaction.nonce : await fetchBestNonce(transaction)

        const unsignedTransaction = await createUnsignedTransaction(nonce, transaction)

        if (!(await validateBeforeSend(transaction, unsignedTransaction))) {
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
        if (e.code === 502 || e.reason === 'bcNodeError') {
          logError(e, 'CONNECTION_ERROR')
        } else {
          logError(e, 'TRANSACTION_FAILED')
          await requests.failRequestTransaction(transaction, e)
        }
      }
    })
    await promiseSerial(promises)
  },
}

const {db, config, blockchain} = require('../context')
const {exceptions: {NotFoundError, InvalidStateError}} = require('@welldone-software/node-toolbelt')
const {errors: {errSerializer}} = require('stox-common')
const {Big} = require('big.js')
const {pick} = require('lodash')
const moment = require('moment')
const {literal} = require('sequelize')

const isResendTransaction = transaction => transaction.originalTransactionId

const isCancellationTransaction = transaction => transaction.type === 'cancellation'

const updateTransactionError = (id, error) =>
  db.transactions.update({error: errSerializer(error), completedAt: Date.now()}, {where: {id}})

const getTransaction = async (query) => {
  const transaction = await db.transactions.findOne({where: query})
  if (!transaction) {
    throw new NotFoundError('transactionNotFound', query)
  }
  return transaction
}

const validateTransactionForResend = (transaction) => {
  const throwError = (msg) => {
    throw new InvalidStateError(msg)
  }
  return transaction.error ? throwError('transactionError')
    : transaction.completedAt ? throwError('transactionCompleted')
      : transaction.resentAt ? throwError('transactionAlreadyResent')
        : transaction.canceledAt ? throwError('transactionCanceled') : true
}

const cancelTransaction = async (transaction, dbTransaction) => {
  validateTransactionForResend(transaction)

  const {requestId, subRequestIndex, subRequestData, subRequestType, network, from,
    nonce, gasPrice, originalTransactionId, id} = transaction

  await transaction.update({canceledAt: new Date()}, {transaction: dbTransaction})

  if (!transaction.sentAt) {
    transaction.update(
      {error: errSerializer('transactionCanceled'), completedAt: Date.now()},
      {where: {sentAt: {$ne: null}}, transaction: dbTransaction}
    )
  } else {
    await db.transactions.create(
      {
        requestId,
        type: 'cancellation',
        subRequestIndex,
        subRequestData,
        subRequestType,
        network,
        from,
        to: from,
        nonce,
        gasPrice,
        originalTransactionId: originalTransactionId || id,
      },
      {transaction: dbTransaction}
    )
  }
}

const resendTransaction = async (transaction, ignoreMaxGasPrice) => {
  ignoreMaxGasPrice = ignoreMaxGasPrice === true
  validateTransactionForResend(transaction)
  const dbTransaction = await db.sequelize.transaction()
  const {requestId, type, subRequestIndex, subRequestData, subRequestType,
    transactionData, network, from, to, nonce, gasPrice, originalTransactionId, id} = transaction
  if (!transaction.sentAt) {
    throw new InvalidStateError('transactionNotSentYet')
  }
  try {
    await transaction.update({resentAt: new Date()}, {transaction: dbTransaction})
    const resentTransaction = await db.transactions.create(
      {
        requestId,
        type,
        subRequestIndex,
        subRequestData,
        subRequestType,
        transactionData,
        network,
        from,
        to,
        nonce,
        gasPrice,
        originalTransactionId: originalTransactionId || id,
        ignoreMaxGasPrice,
      },
      {transaction: dbTransaction}
    )
    await dbTransaction.commit()
    return pick(resentTransaction, ['id', 'requestId'])
  } catch (e) {
    dbTransaction.rollback()
    throw e
  }
}

const resendTransactions = async (body) => {
  const query = pick(body, ['account', 'nonce', 'gasPrice', 'transactionHash'])
  const transactions = await db.transactions.findAll({where: {...query, resentAt: null}})
  return Promise.all(transactions.map(async (transaction) => {
    try {
      return await resendTransaction(transaction, body.ignoreMaxGasPrice)
    } catch (e) {
      return e
    }
  }))
}

const getPendingTransactionsGasPrice = async from => (await db.transactions.sum(
  'estimatedGasCost',
  {where: {estimatedGasCost: {$ne: null}, sentAt: {$ne: null}, resentAt: null, completedAt: null, from}}
)) || 0

const getPendingAccounts = () =>
  db.transactions.findAll({
    attributes: [[literal('distinct "from"'), 'from']],
    where: {sentAt: null, completedAt: null},
  })

const getInsufficientAccounts = async () => {
  const pendingAccounts = await getPendingAccounts()
  return (await Promise.all(pendingAccounts.map(async (pendingAccount) => {
    const balance = await blockchain.web3.eth.getBalance(pendingAccount.from)
    return Big(balance).lte(config.minimumAccountBalance) ? pendingAccount.from : null
  }))).filter(account => account)
}

const getPendingTransactions = async (insufficientAccounts, limit) => db.transactions.findAll({
  include: [{model: db.requests, include: {model: db.gasPercentiles}}],
  where: {from: {$notIn: insufficientAccounts}, sentAt: null, completedAt: null},
  order: [['originalTransactionId'], [db.requests, db.gasPercentiles, 'percentile', 'DESC'], ['createdAt']],
  limit,
})
const getUnconfirmedTransactions = limit =>
  db.transactions.findAll({
    include: [{model: db.requests, include: {model: db.gasPercentiles}}],
    where: {sentAt: {$ne: null}, completedAt: null},
    limit,
  })

const rejectRelatedTransactions = async ({id, transactionHash, nonce, from}, dbTransaction) => db.transactions.update(
  {error: {reason: 'transaction override', transactionId: id, transactionHash}, completedAt: Date.now()},
  {
    where: {
      id: {$ne: id},
      nonce,
      from,
    },
  },
  dbTransaction
)

const isSentWithGasPriceHigherThan = (from, nonce, gasPrice) =>
  db.transactions.findOne({where: {nonce, from, gasPrice: {$gt: gasPrice}}})

const updateCompletedTransaction = async (transactionInstance, {isSuccessful, blockTime, receipt}) => {
  const dbTransaction = await db.sequelize.transaction()
  try {
    await rejectRelatedTransactions(transactionInstance, dbTransaction)
    await transactionInstance.updateAttributes(
      {
        completedAt: Date.now(),
        receipt,
        currentBlockTime: blockTime,
        gasUsed: receipt.gasUsed,
        blockNumber: receipt.blockNumber,
        error: isSuccessful ? null : {message: 'error in blockchain transaction'},
      },
      {
        transaction: dbTransaction,
      }
    )
    await dbTransaction.commit()

    return transactionInstance.dataValues
  } catch (e) {
    dbTransaction.rollback()
    throw e
  }
}

const addTransactions = async (requestId, transactions) => {
  const dbTransaction = await db.sequelize.transaction()

  try {
    await db.transactions.bulkCreate(transactions, {transaction: dbTransaction})
    await db.requests.update(
      {transactionPreparedAt: Date.now()},
      {where: {id: requestId}}, {transaction: dbTransaction}
    )
    await dbTransaction.commit()
  } catch (error) {
    dbTransaction.rollback()
    throw error
  }
}

const isTransactionConfirmed = completedTransaction =>
  completedTransaction && completedTransaction.confirmations >= Number(config.requiredConfirmations)

const isMinedTransactionInDb = async ({requestId, from, nonce}) => {
  const relatedTransaction = await db.transactions.findAll({where: {requestId, from, nonce}})
  return (await Promise.all(relatedTransaction.map(async transaction =>
    transaction.transactionHash && blockchain.web3.eth.getTransactionReceipt(transaction.transactionHash))))
    .filter(transaction => transaction)
}

const isAlreadyMined = async ({from, nonce}) => {
  const transactionsCount = await blockchain.web3.eth.getTransactionCount(from)
  return Big(transactionsCount).gt(nonce)
}

const isTimeForResend = (transaction) => {
  const {gasPercentile} = transaction.request
  const isCurrentPriceGreaterThanSentPrice = Big(gasPercentile.price).gt(transaction.gasPrice)
  const isCurrentPriceLowerThanMaxPrice = Big(gasPercentile.price).lt(gasPercentile.maxGasPrice)
  const dateForResend = moment(transaction.sentAt).add(Number(gasPercentile.autoResendAfter), 'minutes')
  return moment().isAfter(dateForResend) && isCurrentPriceGreaterThanSentPrice && isCurrentPriceLowerThanMaxPrice
}


module.exports = {
  getTransaction,
  getPendingTransactions,
  getUnconfirmedTransactions,
  updateCompletedTransaction,
  addTransactions,
  resendTransaction,
  updateTransactionError,
  isTransactionConfirmed,
  isResendTransaction,
  isSentWithGasPriceHigherThan,
  isAlreadyMined,
  isMinedTransactionInDb,
  isCancellationTransaction,
  cancelTransaction,
  getPendingTransactionsGasPrice,
  isTimeForResend,
  resendTransactions,
  getInsufficientAccounts,
}

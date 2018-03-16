const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {writePendingTransactionsCron} = require('../config')
const {
  services: {
    accounts: {nounceFromAccountNounces, findOrCreateAccountNounce},
    requests,
    transactions: {getPendingTransactions},
  },
  context,
} = require('stox-bc-request-manager-common')

const fetchNounceFromParityNode = async () => 3.14

const isTransactionAlreadySigned = async ({from, network}, dbTransaction) => {
  const nounceFromParity = await fetchNounceFromParityNode()
  const nounceFromAccountNounce = await nounceFromAccountNounces(from, network, dbTransaction)
  return [nounceFromAccountNounce >= nounceFromParity, nounceFromParity + 1]
}

const fetchGasPriceFromGasCalculator = async () => 3.14

const signTransactionInTransactionSigner = async trans => trans

const sendTransactionToBlockchain = async () => '123123123123123'

const updateTransaction = async (trans ,nounce, transaction) => {
  const gasPrice = await fetchGasPriceFromGasCalculator(trans) // d.v
  const signedTransaction = await signTransactionInTransactionSigner(trans) // d.vi

  const transactionHash = await sendTransactionToBlockchain(signedTransaction) // f.i

  await trans.update(
    {
      // f.ii
      transactionHash,
      gasPrice,
      nounce,
      sentAt: Date.now(),
    },
    {transaction}
  )
}

const updateRequest = async ({requestId} ,transaction) => {
  const request = await requests.getRequestById(requestId)
  await request.update({sentAt: Date.now()}, {transaction}) // f.iii
}

const updateAccountNounce = async ({from, network}, nounce ,transaction) => {
  // f.iv
  const accountNounce = await findOrCreateAccountNounce(from, network, transaction)
  await accountNounce.update({nounce}, {transaction})
}

module.exports = {
  cron: writePendingTransactionsCron,
  job: async () => {
    const {db} = context
    const pendingTransactions = await getPendingTransactions() // d.i
    const transaction = await db.sequelize.transaction()

    try {
      await Promise.all(pendingTransactions.map(async (trans) => {
        const [alreadySigned, nounce] = await isTransactionAlreadySigned(trans, transaction)

        if (alreadySigned) {
          // d.ii-iv
          logger.info({transaction: trans}, 'transaction already signed')
          return
        }

        await updateTransaction(trans ,nounce, transaction)
        await updateRequest(trans, transaction)
        await updateAccountNounce(trans ,nounce, transaction)

        logger.info({transaction: trans}, 'SUCCESSFULLY_UPDATED_TRANSACTION')
      }))

      await transaction.commit()
    } catch (e) {
      transaction.rollback()
      throw new UnexpectedError(e)
    }
  },
}

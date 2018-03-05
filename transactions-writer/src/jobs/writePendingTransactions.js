const context = require('context')
const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {utils: {getAllUnsentFromTable, nounceFromAccountNounces}} = require('stox-bc-request-manager-common')


const fetchNounceFromParityNode = async () => 3.14

const isTransactionAlreadySigned = async ({from, network}, dbTransaction) => {
  const nounceFromParity = await fetchNounceFromParityNode()
  const nounceFromAccountNounce = await nounceFromAccountNounces(from, network, dbTransaction)
  return [nounceFromAccountNounce >= nounceFromParity, nounceFromParity + 1]
}

const fetchGasPriceFromGasCalculator = async () => 3.14

const signTransactionInTransactionSigner = async t => t

const sendTransactionToBlockchain = async () => '123123123123123'

module.exports = {
  cron: '*/05 * * * * *',
  job: async () => {
    const {db} = context
    const transaction = await db.sequelize.transaction()
    try {
      const transactions = await getAllUnsentFromTable(db.transactions, transaction) // d.i

      await Promise.all(transactions.map(async (t) => {
        const [alreadySigned, nounce] = await isTransactionAlreadySigned(t, transaction)

        if (alreadySigned) { // d.ii-iv
          logger.debug({t}, 'transaction already signed')
          return
        }

        const gasPrice = await fetchGasPriceFromGasCalculator(t) // d.v
        const signedTransaction = await signTransactionInTransactionSigner(t) // d.vi
        const tranascationHash = await sendTransactionToBlockchain(signedTransaction) // f.i

        await t.update({ // f.ii
          tranascationHash,
          gasPrice,
          nounce,
          sentAt: Date.now(),
        })

        const {requestId, from, network} = t

        const request = await db.requests.findOne({where: {id: requestId}})
        await request.update({sentAt: Date.now()}, {transaction}) // f.iii

        const accountNounce = await db.accountNounces.findOrCreate({where: {account: from, network}})
        await accountNounce.update({nounce}) // f.iv
      }))

      await transaction.commit()
    } catch (e) {
      transaction.rollback()
      throw new UnexpectedError(e)
    }
  },
}

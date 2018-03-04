const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {utils: {updateSentRecords, getAllUnsentFromTable}} = require('stox-bc-request-manager-common')

const context = require('context')

// just changes sentAt field for now(), need later integration with blockchain, parity node ect..
module.exports = {
  cron: '*/05 * * * * *',
  job: async () => {
    const {db} = context
    const transaction = await db.sequelize.transaction()
    try {
      const transactions = await getAllUnsentFromTable(db.transactions, transaction)
      if (transactions.length) {
        logger.debug('Transactions to be signed: ', transactions)
        const transactionToUpdate = transactions.map(({id}) => id)
        await updateSentRecords(db.transactions, transactionToUpdate, transaction)
      }

      await transaction.commit()
    } catch (e) {
      transaction.rollback()
      throw new UnexpectedError(e)
    }
  },
}

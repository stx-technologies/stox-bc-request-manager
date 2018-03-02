const {exceptions: {UnexpectedError}, loggers: {logger}} = require('@welldone-software/node-toolbelt')
const {createService} = require('stox-bc-request-manager-common')
const db = require('db')

const service = createService(db)

// just changes sentAt field for now(), need later integration with blockchain, parity node ect..
module.exports = {
  walletsPool: {
    cron: '*/05 * * * * *',
    job: async () => {
      const transaction = await db.sequelize.transaction()
      try {
        const transactions = await service.getAllUnsentFromTable(db.transactions, transaction)
        if (transactions.length) {
          logger.debug('Transactions to be signed: ', transactions)
          const transactionToUpdate = transactions.map(({id}) => id)
          await service.updateSentRecords(db.transactions, transactionToUpdate, transaction)
        }

        await transaction.commit()
      } catch (e) {
        transaction.rollback()
        throw new UnexpectedError(e)
      }
    },
  },
}

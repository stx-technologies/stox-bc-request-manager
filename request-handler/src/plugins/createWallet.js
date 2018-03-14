const {context: {mq}} = require('stox-bc-request-manager-common')
const {network} = require('../config')

// eslint-disable-next-line no-unused-vars
const createWallet = {
  prepareTransactions: async ({id}) => {
    return {
      requestId: id,
      type: 'send',
      from: 'no address',
      to: 'no address',
      network,
      transactionData: {},
    }
  }
}

module.exports = {
  createWallet
}
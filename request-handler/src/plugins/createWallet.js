const {context: {mq}} = require('stox-bc-request-manager-common')
const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')
const clientHttp = http(walletsApiBaseUrl)

// eslint-disable-next-line no-unused-vars
const createWallet = {
  prepareTransactions: async ({id}) => {
    //TODO: should change to the right endpoint that return the wallet transactionData
    const count = await clientHttp.get(`/unassigned/count`)

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
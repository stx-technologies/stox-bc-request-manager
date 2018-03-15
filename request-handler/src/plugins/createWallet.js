const {network, walletsApiBaseUrl, walletCreationAccountAddress} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id}) => {
    const transactionData = await clientHttp.get('/abi/createWallet')
    return [
      {
        requestId: id,
        type: 'send',
        from: walletCreationAccountAddress,
        network,
        transactionData,
      },
    ]
  },
}

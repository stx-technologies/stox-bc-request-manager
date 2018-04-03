const {network, walletsApiBaseUrl} = require('../config')
const {http} = require('stox-common')

const clientHttp = http(walletsApiBaseUrl)

module.exports = {
  prepareTransactions: async ({id}) => {
    const {fromAccount, encodedAbi} = await clientHttp.get('/abi/createWallet')
    return [
      {
        requestId: id,
        type: 'deploy',
        from: fromAccount,
        network,
        transactionData: encodedAbi,
      },
    ]
  },
}

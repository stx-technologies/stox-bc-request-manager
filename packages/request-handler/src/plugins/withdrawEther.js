const {network, withdrawEtherAccount} = require('../config')

module.exports = {
  prepareTransactions: async ({id, data: {from, value}}) => {
    if (!withdrawEtherAccount) {
      throw new Error('NO_WITHDRAW_ETHER_ACCOUNT')
    }
    return [
      {
        requestId: id,
        type: 'send',
        from,
        to: withdrawEtherAccount,
        value,
        network,
      },
    ]
  },


}

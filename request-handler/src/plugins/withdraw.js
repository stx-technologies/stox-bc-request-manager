const {context: {mq}} = require('stox-bc-request-manager-common')
const {network} = require('../config')

// eslint-disable-next-line no-unused-vars
const withdraw = {
  prepareTransactions: async ({data: {userWalletAddress, amount, tokenAddress, feeAmount, feeTokenAddress}, id}) => {
    // TODO: get clear api about walletABI input and output...
    const {body: {data, address}} = await mq.rpc('walletABI', {address: userWalletAddress})
    return {
      requestId: id,
      type: 'send',
      from: address,
      to: userWalletAddress,
      network,
      transactionData: Buffer.from(data),
    }
  }
}

module.exports = {
  withdraw
}
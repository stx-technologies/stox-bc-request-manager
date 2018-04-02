const {prepareTransactions} = require('./setWithdrawalAddress')

describe('setWithdrawalAddress', () => {
  it('setWithdrawalAddress prepareTransactions', async () => {
    const dt = {
      walletAddress: 11,
      userWithdrawalAddress: 33,
    }
    const result = await prepareTransactions({id: 8, data: dt})
    expect(result[0]).to.contain({
      network: 'MAIN',
      requestId: 8,
      to: 33,
      type: 'send',
    })
  })
})

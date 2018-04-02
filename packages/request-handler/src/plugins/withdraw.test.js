const {prepareTransactions} = require('./sendToBackup')

describe('sendToBackup', () => {
  // todo: mock encodedAbi fromAccount
  it('sendToBackup prepareTransactions', async () => {
    const dt = {
      walletAddress: 11,
      tokenAddress: 22,
      amount: 2,
      feeTokenAddress: 99,
      fee: 0.1,
    }
    const result = await prepareTransactions({id: 6, data: dt})

    expect(result[0]).to.contain({
      network: 'MAIN',
      requestId: 6,
      type: 'send',
    })
  })
})

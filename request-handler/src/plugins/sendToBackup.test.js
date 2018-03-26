const {prepareTransactions} = require ('./sendToBackup')

describe('sendToBackup', () => {
  // todo: mock encodedAbi fromAccount
  it('sendToBackup prepareTransactions', async () => {

    const dt = {
      userWithdrawalAddress : 1,
      walletAddress : 11,
      tokenAddress : 22,
      amount : 2
    }
    const result = await prepareTransactions({id: 5, data :dt})

    expect(result[0]).to.contain({
      network:"MAIN",
      requestId:5,
      to:1,
      type:"send"
    })
  })
})
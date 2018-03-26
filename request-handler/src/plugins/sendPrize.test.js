const {prepareTransactions} = require ('./sendPrize')

describe('sendPrize', () => {
  it('sendPrize prepareTransactions', async () => {

    const result = await prepareTransactions({id: 1, tokenAddress:11})
    expect(result[0]).to.contain({
      from:"",
      network:"MAIN",
      requestId:1,
      to:11,
      type:"send"
    })

  })

})
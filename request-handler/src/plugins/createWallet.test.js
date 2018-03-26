const {prepareTransactions} = require ('./createWallet')

describe('createWallet', () => {

  it('createWallet prepareTransactions', async () => {

    const result = await prepareTransactions({id: 1})
    expect(result[0]).to.contain({
      from:"",
      network:"MAIN",
      requestId:1,
      type:"send"
    })
  })
})
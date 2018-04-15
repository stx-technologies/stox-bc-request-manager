const {
  provider,
  interactions,
  createInteraction,
  createExpectedResult,
} = require('../pacts/walletsApi')
const uuid4 = require('uuid4')
const {prepareTransactions} = require('../../services/requestHandler')

describe('request-handler integration with database', () => {
  beforeAll(async (done) => {
    await provider.setup()
    done()
  })

  afterEach(async (done) => {
    await provider.verify()
    done()
  })

  afterAll((done) => {
    provider.finalize()
    done()
  })

  interactions.forEach((interaction) => {
    const {type} = interaction
    const request = {id: uuid4(), type, data: interaction.data}
    const expectedTransactions = createExpectedResult(interaction, request.id)

    it(`returns prepared transactions for ${type}`, async (done) => {
      // prepare
      await createInteraction(interaction)

      // act
      const transactions = await prepareTransactions(request)

      // assert
      expect(transactions).toEqual(expectedTransactions)
      done()
    })
  })
})

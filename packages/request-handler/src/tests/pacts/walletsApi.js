const path = require('path')
const URI = require('urijs')
const {Pact} = require('@pact-foundation/pact')
const {network, walletsApiBaseUrl, prizeDistributionAccountAddress} = require('../../config')

const port = new URI(walletsApiBaseUrl).port()

const provider = new Pact({
  port: Number(port),
  spec: 2,
  pactfileWriteMode: 'update',
  consumer: 'request-hanadler',
  provider: 'wallets-api',
  log: path.resolve('./src/tests/logs', 'mockserver-integration.log'),
  dir: path.resolve('./src/tests/pacts'),
  logLevel: 'error',
})

const interactions = [
  {
    type: 'createWallet',
    response: {
      fromAccount: '0x281055afc982d96fab65b3a49cac8b878184cb16',
      encodedAbi: '37678006957194531353',
    },
  },
  {
    type: 'sendPrize',
    response: {
      fromAccount: '0x90e63c3d53e0ea496845b7a03ec7548b70014a91',
      encodedAbi: '34581266314118732280',
    },
    data: {
      userStoxWalletAddress: '0xfe9e8709d3215310075d67e3ed32a380ccf451c8',
      amount: '5',
      tokenAddress: '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45',
    },
    query: {
      prizeReceiverAddress: '0xfe9e8709d3215310075d67e3ed32a380ccf451c8',
      tokenAddress: '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45',
      amount: '5',
      prizeDistributorAddress: prizeDistributionAccountAddress,
    },
  },
  {
    type: 'sendToBackup',
    response: {
      fromAccount: '0x3d2e397f94e415d7773e72e44d5b5338a99e77d9',
      encodedAbi: '22969822257020667277',
    },
    data: {
      userWithdrawalAddress: 'userWithdrawalAddress',
      amount: '3',
      tokenAddress: '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45',
      walletAddress: '0xb8487eed31cf5c559bf3f4edd166b949553d0d11',
    },
    query: {
      walletAddress: '0xb8487eed31cf5c559bf3f4edd166b949553d0d11',
      tokenAddress: '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45',
      amount: '3',
    },
  },
  {
    type: 'setWithdrawalAddress',
    response: {
      fromAccount: '0x74660414dfae86b196452497a4332bd0e6611e82',
      encodedAbi: '25537374028356628103',
    },
    data: {
      walletAddress: '0xfca70e67b3f93f679992cd36323eeb5a5370c8e4',
      userWithdrawalAddress: '0x1b3cb81e51011b549d78bf720b0d924ac763a7c2',
    },
    query: {
      walletAddress: '0xfca70e67b3f93f679992cd36323eeb5a5370c8e4',
      userWithdrawalAddress: '0x1b3cb81e51011b549d78bf720b0d924ac763a7c2',
    },
  },
  {
    type: 'withdraw',
    response: {
      fromAccount: '0x6f52730dba7b02beefcaf0d6998c9ae901ea04f9',
      encodedAbi: '08879658622234506255',
    },
    data: {
      walletAddress: '0xf4b51b14b9ee30dc37ec970b50a486f37686e2a8',
      amount: '7',
      fee: '1',
      feeTokenAddress: '0x5ffc99b5b23c5ab8f463f6090342879c286a29be',
      tokenAddress: '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45',
    },
    query: {
      walletAddress: '0xf4b51b14b9ee30dc37ec970b50a486f37686e2a8',
      amount: '7',
      fee: '1',
      feeTokenAddress: '0x5ffc99b5b23c5ab8f463f6090342879c286a29be',
      tokenAddress: '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45',
    },
  },
]

const createExpectedResult = ({type, data, response: {fromAccount, encodedAbi}}, id) => {
  switch (type) {
    case 'createWallet':
      return [
        {
          requestId: id,
          network,
          type: 'deploy',
          from: fromAccount,
          transactionData: encodedAbi,
        },
      ]
    case 'sendPrize':
      return [
        {
          requestId: id,
          type: 'send',
          from: fromAccount,
          to: data.userStoxWalletAddress,
          network,
          transactionData: encodedAbi,
        },
      ]

    case 'sendToBackup':
      return [
        {
          requestId: id,
          type: 'send',
          from: fromAccount,
          to: data.userWithdrawalAddress,
          network,
          transactionData: encodedAbi,
        },
      ]
    case 'setWithdrawalAddress':
      return [
        {
          requestId: id,
          type: 'send',
          from: fromAccount,
          to: data.userWithdrawalAddress,
          network,
          transactionData: encodedAbi,
        },
      ]
    case 'withdraw':
      return [
        {
          requestId: id,
          type: 'send',
          from: fromAccount,
          to: data.walletAddress,
          network,
          transactionData: encodedAbi,
        },
      ]
    default:
      return null
  }
}

const createInteraction = ({response, type, query}) =>
  provider.addInteraction({
    uponReceiving: `a request for ${type} getAbi api`,
    withRequest: {
      method: 'GET',
      path: `/api/v1/abi/${type}`,
      query,
      headers: {Accept: 'application/json, text/plain, */*'},
    },
    willRespondWith: {
      status: 200,
      headers: {'Content-Type': 'application/json'},
      body: response,
    },
  })

const createFailedInteraction = ({type, query}) =>
  provider.addInteraction({
    uponReceiving: `an error request for ${type} getAbi api`,
    withRequest: {
      method: 'GET',
      path: `/api/v1/abi/${type}`,
      query,
      headers: {Accept: 'application/json, text/plain, */*'},
    },
    willRespondWith: {
      status: 500,
      headers: {'Content-Type': 'application/json'},
      body: {error: 'interaction error mock'},
    },
  })

module.exports = {
  provider,
  interactions,
  createInteraction,
  createExpectedResult,
  createFailedInteraction,
}

const {db, blockchain, config} = require('../context')

const getGasPriceByPriority = async (priority = 'medium') => {
  const priceLevel = await db.gasPrices.findOne({where: {type: priority}})
  return priceLevel ? priceLevel.price : null
}

const getGasLevels = () => db.gasPrices.findAll()

const isBlockPassThresholdMinutes = (testBlock) => {
  const seconds = Date.now() / 1000
  const diff = seconds - testBlock.timestamp
  return diff > config.refreshGasPricesPeriodSeconds
}

const getPricesFromBlock = async block => Promise.all(block.transactions.map(async transaction =>
  (await blockchain.web3.eth.getTransaction(transaction)).gasPrice))

const calculateGasPrices = async (gasLeveles) => {
  let testBlock = await blockchain.web3.eth.getBlock('latest')
  const gasPricesArr = []
  const gasPrices = {}
  while (!isBlockPassThresholdMinutes(testBlock)) {
    const gasPricesFromBlock = await getPricesFromBlock(testBlock)
    gasPricesArr.push(...gasPricesFromBlock)
    testBlock = await blockchain.web3.eth.getBlock(testBlock.number - 1)
  }
  gasPricesArr.sort((a, b) => a - b)
  gasLeveles.forEach((gasLevel) => {
    const levelPlace = Math.floor(gasPricesArr.length * (gasLevel.level / 100))
    gasLevel.update({price: gasPricesArr[levelPlace]})
    gasPrices[gasLevel.type] = gasPricesArr[levelPlace]
  })
  return gasPrices
}


module.exports = {
  getGasLevels,
  calculateGasPrices,
  getGasPriceByPriority,
}

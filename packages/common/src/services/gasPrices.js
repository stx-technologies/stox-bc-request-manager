const {db, blockchain, config, logger} = require('../context')
const {Big} = require('big.js')

const getGasPercentiles = () => db.gasPercentiles.findAll()

const fetchGasPrices = async () => {
  const gasPercentiles = await getGasPercentiles()
  const gasPricesByPriority = {}
  gasPercentiles.forEach((gasPercentile) => {
    gasPricesByPriority[gasPercentile.dataValues.priority] = gasPercentile.dataValues.price
  })
  return gasPricesByPriority
}

const calcGasPriceForResend = async (sentGasPrice) => {
  if (Big(sentGasPrice).gte(config.maximumGasPrice)) {
    return 0
  }
  const gasPricePlusTenPercent = Big(sentGasPrice).times(1.1)
  const {low, medium, high} = await fetchGasPrices()
  switch (true) {
    case (Big(low).gt(gasPricePlusTenPercent)):
      return low
    case (Big(medium).gt(gasPricePlusTenPercent)):
      return medium
    case (Big(high).gt(gasPricePlusTenPercent)):
      return high
    default:
      return config.maximumGasPrice
  }
}

const getGasPriceByPriority = async (priority) => {
  const gasPercentile = await db.gasPercentiles.findOne({where: {priority: priority || 'low'}})
  return gasPercentile ? gasPercentile.price : parseInt(config.defaultGasPrice, 10)
}


const isBlockPassThresholdSeconds = (testBlock) => {
  const seconds = Date.now() / 1000
  const diff = seconds - testBlock.timestamp
  return diff > config.refreshGasPricesIntervalSeconds
}

const getPricesFromBlock = async block => Promise.all(block.transactions.map(async transaction =>
  (await blockchain.web3.eth.getTransaction(transaction)).gasPrice))

const calculateGasPrices = async (gasPercentiles) => {
  let block = await blockchain.web3.eth.getBlock('latest')
  let blocksCheckedCount = 1
  const gasPricesArray = []
  const gasPrices = {}

  while (!isBlockPassThresholdSeconds(block) && config.maxNumberOfBlocksToCheck > blocksCheckedCount) {
    const gasPricesFromBlock = await getPricesFromBlock(block)
    gasPricesArray.push(...gasPricesFromBlock)
    block = await blockchain.web3.eth.getBlock(block.number - 1)
    blocksCheckedCount++
  }

  gasPricesArray.sort((a, b) => a - b)
  await Promise.all(gasPercentiles.map(async (gasPercentile) => {
    const percentileIndex = Math.floor(gasPricesArray.length * (gasPercentile.percentile / 100))
    const price = gasPricesArray[percentileIndex]
    gasPrices[gasPercentile.priority] = price
    await gasPercentile.update({price})
  }))
  return gasPrices
}

const calculateGasPrice = async (priority) => {
  const gasPrice = await getGasPriceByPriority(priority)
  if (Big(gasPrice).gt(config.maximumGasPrice)) {
    const lowGasPrice = await getGasPriceByPriority('low')
    logger.error(
      {
        gasPrice,
        maximumGasPrice: config.maximumGasPrice,
        lowGasPrice,
      },
      'GAS_PRICE_IS_TOO_HIGH'
    )
    if (Big(config.maximumGasPrice).gt(lowGasPrice)) {
      return config.maximumGasPrice
    }
    return null
  }
  return gasPrice
}

module.exports = {
  getGasPercentiles,
  calculateGasPrices,
  calcGasPriceForResend,
  calculateGasPrice,
}

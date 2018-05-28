const {db, blockchain, config} = require('../context')

const getGasPriceByPriority = async (priority = 'medium') => {
  const gasPercentile = await db.gasPercentiles.findOne({where: {type: priority}})
  return gasPercentile ? gasPercentile.price : parseInt(config.defaultGasPrice, 10)
}

const getGasPercentiles = () => db.gasPercentiles.findAll()

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
    gasPrices[gasPercentile.type] = price
    await gasPercentile.update({price})
  }))
  return gasPrices
}


module.exports = {
  getGasPercentiles,
  calculateGasPrices,
  getGasPriceByPriority,
}

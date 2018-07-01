const {db, blockchain, config} = require('../context')
const {Big} = require('big.js')
const {exceptions: {InvalidStateError}} = require('@welldone-software/node-toolbelt')

const getGasPercentiles = () => db.gasPercentiles.findAll()

const getGasPriceForResend = async (sentGasPrice) => {
  const gasPricePlusTenPercent = Big(sentGasPrice).times(1.1).round(0, 3).toString()
  const nextGasPrice = await db.gasPercentiles.findOne({where:
      {price: {$gt: gasPricePlusTenPercent}},
  order: [['price']]})
  return nextGasPrice ? nextGasPrice.price : gasPricePlusTenPercent
}

const fetchLowestGasPrice = async () => (await db.gasPercentiles.findOne({order: [['price']]})).price

const getGasPriceByPriority = async priority =>
  (await db.gasPercentiles.findOne({where: {priority: (priority || config.defaultGasPriority)}})).price

const shouldCheckBlock = (block, blocksCheckedCount) => {
  const secondsPassed = (Date.now() / 1000) - block.timestamp
  return (secondsPassed < Number(config.refreshGasPricesPeriodSeconds)
    && blocksCheckedCount < Number(config.maximumNumberOfBlocksToCheck))
}

const getGasPricesFromBlock = async block => Promise.all(block.transactions.map(async (transactionHash) => {
  const transaction = await blockchain.web3.eth.getTransaction(transactionHash)
  return transaction.gasPrice
}))

const calculateGasPrices = async (gasPercentiles) => {
  let block = await blockchain.web3.eth.getBlock('latest')
  let blocksCheckedCount = 1
  const gasPricesArray = []
  const gasPrices = {}

  while (shouldCheckBlock(block, blocksCheckedCount)) {
    const gasPricesFromBlock = await getGasPricesFromBlock(block)
    gasPricesArray.push(...gasPricesFromBlock)
    block = await blockchain.web3.eth.getBlock(block.number - 1)
    blocksCheckedCount++
  }

  if (gasPricesArray.length < Number(config.minimumTransactionsForGasCalculation)) {
    throw new InvalidStateError('NOT_ENOUGH_GAS_PRICES_FOR_CALCULATION', {gasPricesLength: gasPricesArray.length})
  }
  gasPricesArray.sort((a, b) => a - b)
  await Promise.all(gasPercentiles.map(async (gasPercentile) => {
    const percentileIndex = Math.floor(gasPricesArray.length * (gasPercentile.percentile / 100))
    const price = gasPricesArray[percentileIndex]
    gasPrices[gasPercentile.priority] = price
    gasPercentile.changed('updatedAt', true)
    gasPercentile.price = price
    await gasPercentile.save()
  }))
  return gasPrices
}

const isMaximumGasPriceGreatThanLowest = async () => {
  const lowestGasPrice = await fetchLowestGasPrice()
  return Big(config.maximumGasPrice).gte(lowestGasPrice)
}

module.exports = {
  getGasPercentiles,
  calculateGasPrices,
  getGasPriceForResend,
  getGasPriceByPriority,
  isMaximumGasPriceGreatThanLowest,
}

const {gasCalculatorCron} = require('../config')
const {errors: {logError}} = require('stox-common')
const {
  services: {
    gasPrices: {getGasLevels, calculateGasPrices},
  },
  context,
} = require('stox-bc-request-manager-common')


module.exports = {
  cron: gasCalculatorCron,
  job: async () => {
    const gasLevels = await getGasLevels()
    if (!gasLevels.length) {
      context.logger.error('NO_GAS_LEVELS')
    }
    try {
      const gasPrices = await calculateGasPrices(gasLevels)
      context.logger.info(gasPrices, 'SUCCESSFULLY_UPDATED_PRICES')
    } catch (e) {
      logError(e, 'FAILED_GAS_PRICE_CALCULATION')
    }
  },
}

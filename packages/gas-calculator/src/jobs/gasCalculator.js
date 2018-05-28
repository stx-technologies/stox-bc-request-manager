const {gasCalculatorCron} = require('../config')
const {errors: {logError}} = require('stox-common')
const {
  services: {
    gasPrices: {getGasPercentiles, calculateGasPrices},
  },
  context,
} = require('stox-bc-request-manager-common')


module.exports = {
  cron: gasCalculatorCron,
  job: async () => {
    const gasPercentiles = await getGasPercentiles()
    if (!gasPercentiles.length) {
      context.logger.error('NO_GAS_LEVELS')
    } else {
      try {
        const gasPrices = await calculateGasPrices(gasPercentiles)
        context.logger.info(gasPrices, 'SUCCESSFULLY_UPDATED_PRICES')
      } catch (e) {
        logError(e, 'FAILED_GAS_PRICE_CALCULATION')
      }
    }
  },
}

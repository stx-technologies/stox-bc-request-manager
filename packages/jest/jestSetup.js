const chai = require('chai')
const chaiJestDiff = require('chai-jest-diff').default

chai.use(chaiJestDiff())

global.assert = chai.assert
global.expect = chai.expect
global.jestExpect = global.expect

global.sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000

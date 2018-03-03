const path = require('path')
const fs = require('fs')
const {transform} = require('lodash')

const normalizedPath = path.join(__dirname, './')
const files = fs.readdirSync(normalizedPath)

module.exports = (context) => {
    return transform(files, (acc, file) => {
        if (file === 'index.js') return
        const name = file.replace('.js', '')
        acc[name] = require(`./${name}`)(context)
        return acc
    }, {})
}

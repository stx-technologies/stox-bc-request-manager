const oneline = (strings, ...params) =>
  strings.reduce(
    (prev, curr, index) => prev + curr.replace(/[\s\t\r\n]/g, '') + (index in params ? params[index] : ''),
    ''
  )

module.exports = {oneline}

const fs = require('fs')
const path = require('path')
const {exec} = require('child_process')

const runConcurrently = () => {
  const type = process.argv[2]
  const commands = fs.readdirSync(__dirname)
    .map(d => path.join(__dirname, d))
    .filter(d => fs.lstatSync(d).isDirectory())
    .map(d => path.basename(d))
    .filter(d => !d.startsWith('.') && !['common', 'node_modules'].includes(d))
    .map((directory) => {
      const startCommand = `npm start --prefix ${directory}`
      const envPath = path.join(__dirname, directory, `.env.${type}`)
      if (type) {
        if (!fs.existsSync(envPath)) {
          console.log(`No .env.${type} on service ${directory}, using default .env`)
          return startCommand
        }

        const envs = fs.readFileSync(envPath, 'utf8').split('\n')
        return [...envs, startCommand].join(' ')
      }

      return startCommand
    })

  commands.forEach((command) => {
    const process = exec(command)
    process.stdout.on('data', console.log)
    process.stderr.on('data', console.error)
  })
}

runConcurrently()

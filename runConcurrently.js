const fs = require('fs')
const path = require('path')
const shelljs = require('shelljs')

const runConcurrently = () => {
  const type = process.argv[2]
  const dirs = fs.readdirSync(__dirname)
    .map(d =>path.join(__dirname,d))
    .filter(d => fs.lstatSync(d).isDirectory())
    .map(d => path.basename(d))
    .filter(d => !d.startsWith('.') && !['common','node_modules'].includes(d))
    .map(d => {
      const startCommand = `npm start --prefix ${d}`
      const envPath = path.join(__dirname,d,`.env.${type}`)
      if(type) {
        if(!fs.existsSync(envPath)) {
          console.log(`No .env.${type} on service ${d}, using default .env`)
          return startCommand
        }

        const envs = fs.readFileSync(envPath,"utf8").split('\n')
        return [...envs, startCommand].join(' ')
      }

      return startCommand
    })
    .map(d => `\"${d}\"`)
    .join(' ')
  console.log(dirs)
  shelljs.exec(`concurrently --kill-others ${dirs}`)

  console.log(dirs)
}
runConcurrently()

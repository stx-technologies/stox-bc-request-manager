const {exec} = require('child_process')
const {join} = require('path')
const {readdirSync, readFileSync} = require('fs')

const escapeJson = json =>
  JSON.stringify(json)
    .replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\$')
    .replace(/'/g, '\\\'')
    .replace(/"/g, '\\"')

const executCommand = command =>
  exec(command, (error) => {
    console.error(error)
  })

const image = process.argv[2]
const env = process.argv[3]
const tasksPath = join(__dirname, 'taskDefinitions', env)

readdirSync(tasksPath).map((d) => {
  const template = JSON.parse(readFileSync(join(tasksPath, d), 'utf8'))
  template.containerDefinitions[0].image = image
  return `aws ecs register-task-definition --cli-input-json "${escapeJson(template)}"`
}).forEach(executCommand)

const {exec} = require('child_process')
const {join} = require('path')
const {readdirSync, readFileSync} = require('fs')

const escapeJson = json =>
  JSON.stringify(json)
    .replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\$')
    .replace(/'/g, '\\\'')
    .replace(/"/g, '\\"')

const executeCommand = command => new Promise((resolve, reject) => {
  exec(command, (error, stdout) => {
    if (error) {
      reject(error)
      return
    }
    resolve(stdout)
  })
})

const image = process.argv[2]
const env = process.argv[3]
const tasksPath = join(__dirname, 'taskDefinitions', env)

readdirSync(tasksPath).forEach(async (d) => {
  try {
    const template = JSON.parse(readFileSync(join(tasksPath, d), 'utf8'))
    template.containerDefinitions[0].image = image

    const {family} = template
    const options = `--cli-input-json "${escapeJson(template)}"`
    const result = await executeCommand(`aws ecs register-task-definition ${options}`)

    const jsonResult = JSON.parse(result)
    console.log(jsonResult)

    const {revision} = jsonResult.taskDefinition
    const updateService = `aws ecs update-service --cluster stox-${env} --service ${family}`

    const res1 = await executeCommand(`${updateService} --desired-count 0`)
    console.log(res1)
    const res2 = await executeCommand(`${updateService} --desired-count 1 --task-definition ${family}:${revision}`)
    console.log(res2)
  } catch (e) {
    console.error(e)
  }
})

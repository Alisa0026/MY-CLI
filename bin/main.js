#!/usr/bin/env node

// #!/usr/bin/env node表明该文件是可执行文件
// 脚本文件bin/main.js ，用 commander来向用户展示脚手架功能，用 chalk来处理高亮显示。该文件主要是处理交互与显示，脚手架的核心逻辑放到 lib/create.js。
// ● commander 描述脚手架基本功能。
// ● create() 为脚手架核心逻辑。

const program = require('commander')
const { chalk } = require('@vue/cli-shared-utils')
const create = require('../lib/create')

program
  .version(`next-cli ${require('../package').version}`)
  .usage('<command> [options]')

program
  .command('create <app-name>')
  .description('创建项目')
  .action((name, options) => {
    console.log(chalk.bold.blue(`Next CLI V1.0.0`))
    create(name, options)
  })

program.on('--help', () => {
  console.log()
  console.log(`  Run ${chalk.yellow(`next-cli <command> --help`)} for detailed usage of given command.`)
  console.log()
})

program.parse(process.argv)
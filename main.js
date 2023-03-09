const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer')
const ejs = require('ejs')

// console.log(`${chalk.blue('hello')}, ${chalk.red('this')} ${chalk.underline('is')} ${chalk.bgRed('chalk')}!`);

/**
 * type 表示类型，input 表示输入框，list 表示单选项，checkbox 表示多选项，confirm 表示确认项。
 * name 表示键名，default 表默认值，message 是名称。
 */
const arr = [
    {
        type: 'input',
        name: 'projectName',
        message: '项目名称',
        default: 'vue-demo',
    },
    {
        type: 'list',
        name: 'projectType',
        message: '项目类型',
        default: 'vue2',
        choices: [
            { name: 'vue2', value: 'vue2' },
            { name: 'vue3', value: 'vue3' },
            { name: 'react', value: 'react' }
        ]
    },
    {
        type: 'checkbox',
        name: 'plugins',
        message: '插件选择',
        choices: [
            { name: 'babel', value: 'babel' },
            { name: 'eslint', value: 'eslint' },
            { name: 'vue-router', value: 'vue-router' }
        ]
    },
    {
        type: 'confirm',
        name: 'confirm',
        message: 'confirm',
    }
];

inquirer.prompt(arr).then(answers => {
    console.log('==============');
    console.log(answers);
}).catch(error => {
    console.log('--------------')
    console.log(error)
})

const str = `
<div>
<% if (user) { %>
  <span><%= user.name %></span>
<% } else { %>
  <span>登录</span>
<% } %>
</div>
`;

// 编译模板
let template = ejs.compile(str, {});

// 渲染模板，根据用户状态渲染不同的视图。
const data = { user: null }; // { user: { name: 'zhangsan' } }
console.log(template(data))

// 名称，描述，版本号，用法提示。
program
    .name('cli')
    .description('这是一个神奇的脚手架')
    .version('0.0.1')
    .usage('<command> [options]');

// createPage 命令
program.command('createPage')
    .description('生成一个页面') // 命令描述
    .argument('<name>', '文件名字') // <name> 表 name 为必填
    .action((name) => { // 输入该命令的动作，逻辑实现。
        console.log(`新建了一个文件：${name}`);
    });


program.parse(); // 解析
const fs = require('fs-extra')
const path = require('path')

function writeFileTree(dir, files) {
    Object.keys(files).forEach((name) => {
        const filePath = path.join(dir, name)
        fs.ensureDirSync(path.dirname(filePath))
        fs.writeFileSync(filePath, files[name])
    })
}

function sortObject(obj, keyOrder, dontSortByUnicode) {
    if (!obj) return
    const res = {}

    if (keyOrder) {
        keyOrder.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                res[key] = obj[key]
                delete obj[key]
            }
        })
    }

    const keys = Object.keys(obj)

    !dontSortByUnicode && keys.sort()
    keys.forEach(key => {
        res[key] = obj[key]
    })

    return res
}

function stringifyJS(value) {
    const { stringify } = require('javascript-stringify')
    // 2个空格格式化显示
    return stringify(value, null, 2)
}

// extractCallDir 通过调用栈关系提取插件 template 目录路径。
function extractCallDir() {
    // extract api.render() callsite file location using error stack
    const obj = {}

    // Error.captureStackTrace(targetObject) 方法调用时会在 targetObject 中添加一个 .stack 属性。对该属性进行访问时，将以字符串的形式返回 Error.captureStackTrace() 语句被调用时的代码位置信息，也就是调用栈历史。
    Error.captureStackTrace(obj)

    /**
     * 得到
     * Error
        at extractCallDir (/Users/code/code2023/next-cli/lib/util/util.js:38:9)
        at GeneratorAPI.render (/Users/code/code2023/next-cli/lib/GeneratorAPI.js:30:21)
        at module.exports (/Users/code/code2023/code/a2/node_modules/@vue/cli-service/generator/index.js:2:7)
        at Generator.initPlugins (/Users/code/code2023/next-cli/lib/Generator.js:89:13)
    ...
     *  */

    // 接着从 at module.exports (/Users/code/code2023/code/a2/node_modules/@vue/cli-service/generator/index.js:2:7)得到 fileName 值为/Users/code/code2023/code/a2/node_modules/@vue/cli-service/generator/index.js，path.dirname(fileName)值为/Users/code/code2023/code/a2/node_modules/@vue/cli-service/generator。
    const callSite = obj.stack.split('\n')[3]


    // the regexp for the stack when called inside a named function
    const namedStackRegExp = /\s\((.*):\d+:\d+\)$/
    // the regexp for the stack when called inside an anonymous
    const anonymousStackRegExp = /at (.*):\d+:\d+$/


    let matchResult = callSite.match(namedStackRegExp)
    if (!matchResult) {
        matchResult = callSite.match(anonymousStackRegExp)
    }

    const fileName = matchResult[1]
    return path.dirname(fileName)
}

function mergeDeps(sourceDeps, depsToInject) {
    const result = Object.assign({}, sourceDeps)

    for (const depName in depsToInject) {
        const sourceRange = sourceDeps[depName]
        const injectingRange = depsToInject[depName]

        if (sourceRange === injectingRange) continue

        result[depName] = injectingRange
    }
    return result
}

const isObject = val => val && typeof val === 'object'


function printScripts(pkg) {
    const descriptions = {
        build: 'Compiles and minifies for production',
        serve: 'Compiles and hot-reloads for development',
        lint: 'Lints and fixes files',
        'test:e2e': 'Run your end-to-end tests',
        'test:unit': 'Run your unit tests'
    }

    return Object.keys(pkg.scripts || {}).map(key => {
        if (!descriptions[key]) return ''
        return [
            `\n### ${descriptions[key]}`,
            '```',
            `npm run ${key}`,
            '```',
            ''
        ].join('\n')
    }).join('')
}

function generateReadme(pkg) {
    return [
        `# ${pkg.name}\n`,
        '## Project setup',
        '```',
        `npm install`,
        '```',
        printScripts(pkg),
        '### Customize configuration',
        'See [Configuration Reference](https://cli.vuejs.org/config/).',
        ''
    ].join('\n')
}
module.exports = {
    writeFileTree,
    sortObject,
    stringifyJS,
    extractCallDir,
    mergeDeps,
    isObject,
    generateReadme
}
// ConfigTransform 类，用于获取配置文件名及内容，并转换内容为文本。配置文件名可能是 js 后缀的文件，json 后缀的文件，或yaml 后缀的文件，本文暂只考虑 js 后缀的配置文件。
// 本文需要安装的依赖：npm i javascript-stringify
const { stringifyJS } = require('./util/util')

class ConfigTransform {
    // 文件信息
    constructor(options) {
        this.fileDescriptor = options
    }

    // value 文件内容
    transform(value) {
        let file = this.getDefaultFile()
        const { type, filename } = file

        if (type !== 'js') {
            throw new Error('哎呀，出错了，仅支持 js 后缀的配置文件')
        }

        const content = this.getContent(value, filename)

        return {
            filename,
            content
        }
    }

    getContent(value, filename) {
        if (filename === 'vue.config.js') {
            return (
                `const { defineConfig } = require('@vue/cli-service')\n` +
                `module.exports = defineConfig(${stringifyJS(value, null, 2)})`
            )
        } else {
            return `module.exports = ${stringifyJS(value, null, 2)}`
        }
    }

    // 获取 fileDescriptor 第1个对象作为 type 和 filename
    getDefaultFile() {
        const [type] = Object.keys(this.fileDescriptor)
        const [filename] = this.fileDescriptor[type]
        return { type, filename }
    }
}

module.exports = ConfigTransform;
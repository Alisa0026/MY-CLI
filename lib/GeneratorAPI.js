// GeneratorAPI 类，它是 Generator 类的辅助，用于提取文件信息，配置信息。主要了解其2个方法，extendPackage 方法用于将信息记录到 pkg 变量，render 方法读取模板文件。

const fs = require('fs')
const ejs = require('ejs')
const path = require('path')
const { isBinaryFileSync } = require('isbinaryfile')
const { getPluginLink, toShortPluginId, matchesPluginId } = require('@vue/cli-shared-utils')
const { extractCallDir, mergeDeps, isObject } = require('./util/util')

class GeneratorAPI {
    constructor(id, generator, options, rootOptions) {
        this.id = id // 插件 ID，如 @vue/cli-service, @vue/cli-plugin-babel。
        this.generator = generator // 是 Generator 实例。
        this.options = options // 插件 options，如 options: { projectName: 'aaa', vueVersion: '2'...}。
        this.rootOptions = rootOptions //root options

        this.pluginsData = generator.plugins
            .filter(({ id }) => id !== `@vue/cli-service`)
            .map(({ id }) => ({
                name: toShortPluginId(id),
                link: getPluginLink(id)
            }))

        // pluginsData: [
        //   { name: 'babel',link: 'https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-babel' },
        //   { name: 'eslint', link: 'https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-eslint' }
        // ]

        this._entryFile = undefined
    }

    // 提取模板内容。
    render(source, additionalData = {}) {
        const baseDir = extractCallDir()

        if (typeof source === 'string') {
            // 获得模板路径
            source = path.resolve(baseDir, source)

            // 暂存
            this._injectFileMiddleware(async (files) => {

                const data = this._resolveData(additionalData)
                // 读取 source 目录下所有文件
                const globby = require('globby')
                const _files = await globby(['**/*'], { cwd: source, dot: true })

                for (const rawPath of _files) {
                    // 生成文件时，_ 换成 .   __直接删掉
                    const targetPath = rawPath.split('/').map(filename => {
                        if (filename.charAt(0) === '_' && filename.charAt(1) !== '_') {
                            return `.${filename.slice(1)}`
                        }
                        if (filename.charAt(0) === '_' && filename.charAt(1) === '_') {
                            return `${filename.slice(1)}`
                        }
                        return filename
                    }).join('/')

                    // 源文件路径
                    const sourcePath = path.resolve(source, rawPath)
                    // 读取文件内容
                    const content = this.renderFile(sourcePath, data)
                    // files 记录文件及文件内容
                    if (Buffer.isBuffer(content) || /[^\s]/.test(content)) {
                        files[targetPath] = content
                    }
                }
            })
        }
    }

    // 合并 option
    _resolveData(additionalData) {
        return Object.assign({
            options: this.options,
            rootOptions: this.rootOptions,
            plugins: this.pluginsData
        }, additionalData)
    }

    // middleware 是一个函数，_injectFileMiddleware 用于暂存将 middleware 函数到 generator.fileMiddlewares。执行时接收"文件集合"参数，将 @vue/cli-service/generator/template 下的目录及文件提取给 Generator 实例的 files变量。
    _injectFileMiddleware(middleware) {
        this.generator.fileMiddlewares.push(middleware)
    }

    // renderFile 读取文件，然后用 ejs 渲染
    renderFile(name, data) {
        // 二进制文件，如图片，直接返回
        if (isBinaryFileSync(name)) {
            return fs.readFileSync(name)
        }

        // 其他文件用 ejs 渲染返回
        const template = fs.readFileSync(name, 'utf-8')
        return ejs.render(template, data)
    }

    // extendPackage 执行时，将相关配置提取到 Generator 实例的 pkg变量。
    extendPackage(fields, options = {}) {
        const pkg = this.generator.pkg
        const toMerge = fields

        for (const key in toMerge) {
            const value = toMerge[key]
            const existing = pkg[key]

            // 合并
            if (isObject(value) && isObject(existing)) {
                pkg[key] = mergeDeps(existing || {}, value)
            } else {
                // 不在 pkg 则直接放
                pkg[key] = value
            }
        }
    }

    // 判断项目是否使用了该插件。
    hasPlugin(id) {
        const pluginExists = [
            ...this.generator.plugins.map(p => p.id),
        ].some(pid => matchesPluginId(id, pid))

        return pluginExists;
    }
}

module.exports = GeneratorAPI;
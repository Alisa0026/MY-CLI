// Generator 类用于生成项目文件，配置文件。主要是 generate 方法的实现，外部通过调用 generate 方法来生成文件。

const PackageManager = require('./PackageManager')
const { writeFileTree, sortObject } = require('./util/util.js')
const ConfigTransform = require('./ConfigTransform')
const GeneratorAPI = require('./GeneratorAPI')

// defaultConfigTransforms 是配置文件信息，定义了各个配置文件的默认名字。ConfigTransform 用于获取配置文件名及内容
const defaultConfigTransforms = {
    vue: new ConfigTransform({
        js: ['vue.config.js']
    }),
    babel: new ConfigTransform({
        js: ['babel.config.js']
    }),
    postcss: new ConfigTransform({
        js: ['postcss.config.js'],
    }),
    eslintConfig: new ConfigTransform({
        js: ['.eslintrc.js']
    }),
    jest: new ConfigTransform({
        js: ['jest.config.js']
    }),
    'lint-staged': new ConfigTransform({
        js: ['lint-staged.config.js'],
    })
}

class Generator {
    constructor(context, {
        pkg = {},
        plugins = [],
        files = {}
    } = {}) {
        this.context = context // 目标目录即准备新建的项目目录
        this.plugins = plugins // 插件信息：[{id: '@vue/cli-service', apply: [Function], options: {...}}, ...]
        this.originalPkg = pkg // 
        this.pkg = Object.assign({}, pkg) // 由 Creator 实例传进来的 pkg，为 项目目录 package.json 数据对象。
        this.pm = new PackageManager({ context }) // 实例化打包对象
        this.rootOptions = {}
        this.defaultConfigTransforms = defaultConfigTransforms // 记录 babel, vue 等配置文件默认名字，并提供了提取文件内容的能力。
        this.files = files // 文件信息，用于生成项目文件配置文件。
        this.fileMiddlewares = []
        this.exitLogs = []

        const cliService = plugins.find(p => p.id === '@vue/cli-service') // @vue/cli-service 插件
        const rootOptions = cliService
            ? cliService.options
            : inferRootOptions(pkg)

        this.rootOptions = rootOptions
    }


    async generate({
        extractConfigFiles = false,
        checkExisting = false,
        sortPackageJson = true
    } = {}) {
        // 准备工作,提取配置信息到 pkg (即 Creator 实例的 pkg)，项目文件生成准备工作。
        await this.initPlugins()
        // 将 package.json 中的一些配置提取到专用文件中。
        this.extractConfigFiles(extractConfigFiles, checkExisting)
        // 提取文件内容
        await this.resolveFiles()
        // pkg 字段排序
        if (sortPackageJson) {
            this.sortPkg()
        }
        // 更新 package.json 数据
        this.files['package.json'] = JSON.stringify(this.pkg, null, 2) + '\n'
        // 生成项目文件，配置文件
        await writeFileTree(this.context, this.files)
    }

    // 运行前面导入的模块 @vue/cli-service/generator，@vue/cli-plugin-babel/generator，@vue/cli-plugin-eslint/generator，提取相关信息到 pkg，files。
    async initPlugins() {
        const { rootOptions } = this

        for (const plugin of this.plugins) {
            const { id, apply, options } = plugin
            const api = new GeneratorAPI(id, this, options, rootOptions)
            await apply(api, options, rootOptions, {})
        }
    }

    extractConfigFiles() {
        const ensureEOL = str => {
            if (str.charAt(str.length - 1) !== '\n') {
                return str + '\n'
            }
            return str
        }

        // extractConfigFiles 提取 pkg 的 vue、babel 配置信息到 files 对象，key 为 vue.config.js, babel.config.js。
        const extract = key => {
            const value = this.pkg[key]
            const configTransform = this.defaultConfigTransforms[key]
            // 用于处理配置文件名称，文件内容，并记录到 this.files
            const res = configTransform.transform(
                value,
                false,
                this.files,
                this.context
            )
            const { content, filename } = res
            this.files[filename] = ensureEOL(content)
            // this.files['babel.config.js'] = 文件内容
            // this.files['vue.config.js'] = 文件内容
        }

        // 提取 vue, babel 配置文件名称及其内容
        extract('vue')
        extract('babel')
    }

    // esolveFiles  提取 vue 的项目文件名及内容。
    async resolveFiles() {
        for (const middleware of this.fileMiddlewares) {
            await middleware(this.files)
        }
    }

    sortPkg() {
        // 默认排序
        this.pkg.dependencies = sortObject(this.pkg.dependencies)
        this.pkg.devDependencies = sortObject(this.pkg.devDependencies)

        // 按 serve, build... 排序
        this.pkg.scripts = sortObject(this.pkg.scripts, [
            'serve',
            'build',
            'test:unit',
            'test:e2e',
            'lint',
            'deploy'
        ])

        // 按 name version... 排序
        this.pkg = sortObject(this.pkg, [
            'name',
            'version',
            'private',
            'description',
            'author',
            'scripts',
            'main',
            'module',
            'browser',
            'jsDelivr',
            'unpkg',
            'files',
            'dependencies',
            'devDependencies',
            'peerDependencies',
            'vue',
            'babel',
            'eslintConfig',
            'prettier',
            'postcss',
            'browserslist',
            'jest'
        ])
    }
}

module.exports = Generator;
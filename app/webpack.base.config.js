const HtmlWebpackPlugin = require('html-webpack-plugin');
const CreateFileWebpack = require('create-file-webpack');
const path = require('path');
const util = require('util');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const SymlinkWebpackPlugin = require('symlink-webpack-plugin');

const rootPath = path.resolve(__dirname, "..");
const buildPath = path.join(rootPath, "build");
const assetsPath = path.join(buildPath, "assets");
const devDependencies = require(path.join(rootPath, 'package.json')).devDependencies;
const kernelVersion = devDependencies["@basthon/gui-base"];
let _sys_info;

const languages = {
    "python3": "Python 3",
    "javascript": "JavaScript",
    "sql": "SQL"
};

// build sys_info variable
async function sys_info() {
    if (_sys_info != null) return _sys_info;
    const exec = util.promisify(require('child_process').exec);
    let commitHash = await exec('git rev-parse HEAD');
    commitHash = commitHash.stdout.trim();
    let commitDate = await exec('date -d @$(git log -1 --format="%at") +%Y/%m/%d_%H:%M:%S');
    commitDate = commitDate.stdout.trim();
    _sys_info  = {
        "kernel-version": kernelVersion,
        "commit-hash": commitHash,
        "commit-date": commitDate,
    };
    return _sys_info;
}

// build version file
async function versionFile() {
    return new CreateFileWebpack({
        content: JSON.stringify(await sys_info(), null, 2),
        fileName: "version",
        path: assetsPath
    });
}

// generate index.html from template src/templates/index.html
async function html(language) {
    const sysInfo = JSON.parse(JSON.stringify(await sys_info()));
    sysInfo['language'] = language;
    sysInfo['language-name'] = languages[language];
    return new HtmlWebpackPlugin({
        hash: true,
        sys_info_js: JSON.stringify(sysInfo),
        sys_info: sysInfo,
        template: "./src/templates/index.html",
        filename: `../${language}/index.html`,
        publicPath: "assets/",
        favicon: "notebook/static/base/images/favicon-notebook.ico",
        inject: "head",
        scriptLoading: "blocking"
    });
}

// rendering api/contents/<language>/Untitled.ipynb
function ipynb(language) {
    // looks quite strange to use HTML plugin for that but it works!
    return new HtmlWebpackPlugin({
        language: language,
        languageName: languages[language],
        languageSimple: language === 'python3' ? 'python' : language,
        languageCodemirror: language === 'python3' ? 'ipython' : language,
        template: "./src/templates/Untitled.ipynb",
        filename: `../api/contents/${language}/Untitled.ipynb`,
        inject: false,
    });
}

// all index.html
async function htmls() {
    const result = [];
    for(const language of Object.keys(languages))
        result.push(await html(language));
    return result;
}

// all Untitled.ipynb
function ipynbs() {
    return Object.keys(languages).map(ipynb);
}

// bundle css
function css() {
    return new MiniCssExtractPlugin({
        filename: "[name].[contenthash].css"
    });
}

// copies
function copies() {
    return new CopyPlugin({
        patterns: [
            { // htaccess
                from: "./src/.htaccess", to: buildPath
            },
            {
                from: "examples/**/*",
                to: buildPath,
                toType: "dir"
            },
            {
                from: "api/**/*",
                to: buildPath,
                context: "./notebook/",
                toType: "dir"
            },
            {
                from: "kernelspecs/**/*",
                to: buildPath,
                context: "./notebook/",
                toType: "dir"
            },
            {
                from: "static/**/*",
                to: buildPath,
                context: "./notebook/",
                toType: "dir"
            },
            { // Kernel-Python3 files
                from: "**/*",
                context: "./node_modules/@basthon/kernel-python3/lib/dist/",
                to: path.join(assetsPath, kernelVersion),
                toType: "dir"
            },
            { // reveal.js-chalkboard images
                from: "img/**/*",
                context: "./src/js/nbextensions/rise/reveal.js-chalkboard/",
                toType: "dir"
            },
        ]
    });
}

function languageSymlinks() {
    const links = [{ origin: '../python3/index.html', symlink: '../index.html', force: true },
                   { origin: '../python3/', symlink: '../python', force: true },
                   { origin: '../javascript/', symlink: '../js', force: true }
                  ];
    Object.keys(languages).forEach(language =>
        ['api', 'assets', 'kernelspecs', 'static', 'examples'].forEach(folder =>
            links.push( { origin: `../${folder}/`,
                          symlink: `../${language}/${folder}`,
                          force: true } )
        )
    );
    return new SymlinkWebpackPlugin(links);
}

async function main() {
    return {
        entry: "./src/ts/main.ts",
        output: {
            filename: '[name].[contenthash].js',
            chunkFilename: '[name].[contenthash].js',
            path: assetsPath,
            clean: true
        },
        module: {
            rules: [
                { // internationalization
                    test: /\.po$/,
                    type: "json",
                    use: [{
                        loader: 'po-loader?format=jed1.x'
                    }]
                },
                // shimming google caja sanitizer since it has globals
                {
                    test: /google-caja-sanitizer/,
                    loader: 'exports-loader',
                    options: {
                        type: 'commonjs',
                        exports: ["html", "html4", "sanitizeStylesheet"]
                    }
                },
                // shimming requirejs since it is globals
                // this should be completely removed at the end of the
                // webpacking process
                {
                    test: /requirejs/,
                    loader: 'exports-loader',
                    options: {
                        type: 'commonjs',
                        exports: ["requirejs", "require", "define"]
                    }
                },
                {
                    test: /\.less$/i,
                    use: [
                        // compiles Less to CSS
                        "style-loader",
                        "css-loader",
                        "less-loader"
                    ],
                },
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, "css-loader"],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                },
                { // specific rules for rise plugin
                    resourceQuery: /path-rise/,
                    type: 'asset/resource',
                    generator : {
                        filename : '[name][ext]',
                    }
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
            modules: ['src/', 'src/ts/', 'src/js/', 'node_modules/'],
        },
        plugins: [
            ...await htmls(),
            css(),
            await versionFile(),
            copies(),
            ...ipynbs(),
            languageSymlinks()
        ],
        devServer: {
            static: {
                directory: buildPath,
            },
            compress: true,
            port: 8888,
        },
    };
}

module.exports = main;

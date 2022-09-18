const HtmlWebpackPlugin = require('html-webpack-plugin');
const CreateFileWebpack = require('create-file-webpack');
const path = require('path');
const util = require('util');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const rootPath = path.resolve(__dirname, "..");
const buildPath = path.join(rootPath, "build");
const assetsPath = path.join(buildPath, "assets");
const devDependencies = require(path.join(rootPath, 'package.json')).devDependencies;
const kernelVersion = devDependencies["@basthon/gui-base"];

// build sys_info variable
async function sys_info() {
    if (this.sys_info != null) return this.sys_info;
    var gitRepoInfo = require('git-repo-info')();
    this.sys_info  = {
        "kernel-version": kernelVersion,
        "commit-hash": gitRepoInfo.sha,
        "commit-date": gitRepoInfo.committerDate,
    };
    return this.sys_info;
}

// build version file
async function versionFile() {
    return new CreateFileWebpack({
        content: JSON.stringify(await sys_info(), null, 2),
        fileName: "assets/version",
        path: buildPath
    });
}

// generate index.html from template src/templates/index.html
async function html() {
    const sysInfo = JSON.stringify(await sys_info());
    return new HtmlWebpackPlugin({
        hash: true,
        sys_info: sysInfo,
        template: "./src/templates/index.html",
        filename: `index.html`,
        publicPath: '',
        inject: "head",
        scriptLoading: "blocking"
    });
}

// bundle css
function css() {
    return new MiniCssExtractPlugin({
        filename: "assets/[name].[contenthash].css"
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
                to: path.join(assetsPath, kernelVersion, "python3"),
                toType: "dir"
            },
            { // Kernel-Python3Old files
                from: "**/*",
                context: "./node_modules/@basthon/kernel-python3-old/lib/dist/",
                to: path.join(assetsPath, kernelVersion, "python3-old"),
                toType: "dir"
            },
            { // reveal.js-chalkboard images
                from: "img/**/*",
                context: "./src/js/nbextensions/rise/reveal.js-chalkboard/",
                to: assetsPath,
                toType: "dir",
            },
            { // mathjax
                from: "mathjax/**/*",
                to: assetsPath,
                context: "./node_modules/",
                toType: "dir",
                globOptions: { ignore: ['**/unpacked/**',
                                        '**/test/**',
                                        '**/extensions\/a11y\/mathmaps\/*.js'] },
            },
        ]
    });
}

async function main() {
    return {
        entry: "./src/ts/main.ts",
        output: {
            filename: 'assets/[name].[contenthash].js',
            chunkFilename: 'assets/[name].[contenthash].js',
            assetModuleFilename: 'assets/[hash][ext][query]',
            path: buildPath,
            clean: true
        },
        module: {
            rules: [
                { // internationalization
                    test: /\.po$/,
                    type: "json",
                    use: [{
                        loader: 'po-loader?format=jed'
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
                    test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
                    type: 'asset/resource',
                },
                { // specific rules for rise plugin
                    resourceQuery: /path-rise/,
                    type: 'asset/resource',
                    generator : {
                        filename : 'assets/[name][ext]',
                    }
                },
                { // specific rule for kernel-sql
                    resourceQuery: /asset-url/,
                    type: 'asset/resource',
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
            modules: ['src/', 'src/ts/', 'src/js/', 'node_modules/'],
            fallback: {  // for ocaml bundle
                "constants": require.resolve("constants-browserify"),
                "tty": require.resolve("tty-browserify"),
                "fs": false,
                "child_process": false,
                // for sql bundle
                "crypto": require.resolve("crypto-browserify"),
                "path": require.resolve("path-browserify"),
                "buffer": require.resolve("buffer"),
                "stream": require.resolve("stream-browserify"),
            },
        },
        plugins: [
            await html(),
            css(),
            await versionFile(),
            copies(),
        ],
        devServer: {
            static: {
                directory: buildPath,
            },
            devMiddleware: {
                writeToDisk: true
            },
            compress: true,
            port: 8888,
        },
    };
}

module.exports = main;

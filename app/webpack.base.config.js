const HtmlWebpackPlugin = require('html-webpack-plugin');
const CreateFileWebpack = require('create-file-webpack');
const path = require('path');
const util = require('util');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
//const SymlinkWebpackPlugin = require('symlink-webpack-plugin');

const rootPath = path.resolve(__dirname, "..");
const buildPath = path.join(rootPath, "build");
const assetsPath = path.join(buildPath, "assets");
const kernelVersion = require(path.join(rootPath, 'package.json')).devDependencies["@basthon/kernel-python3"];

// build version file
async function version() {
    const exec = util.promisify(require('child_process').exec);
    let lastCommit = await exec('date -d @$(git log -1 --format="%at") +%Y/%m/%d_%H:%M:%S');
    lastCommit = lastCommit.stdout.trim();
    const version = `${lastCommit}_kernel_${kernelVersion}`;

    return new CreateFileWebpack({
        content: version,
        fileName: "version",
        path: assetsPath
    });
}

// generate index.html from template src/html/index.html
function html(language, languageName) {
    return new HtmlWebpackPlugin({
        hash: true,
        language: language,
        languageName: languageName,
        template: "./src/html/index.html",
        //filename: `../${language}/index.html`,
        filename: `../index.html`,
        publicPath: "assets/",
        favicon: "./src/assets/favicon/favicon.ico"
    });
}

// bundle css
function css() {
    return new MiniCssExtractPlugin({
        filename: "[name].[contenthash].css"
    });
}
/*
// htaccess copy
function htaccess() {
    return new CopyPlugin({
        patterns: [{ from: "./src/.htaccess", to: buildPath }],
    });
}*/

// basthon kernel copy
function python3files() {
    return new CopyPlugin({
        patterns: [{
            from: "**/*",
            context: "./node_modules/@basthon/kernel-python3/lib/dist/",
            to: path.join(assetsPath, kernelVersion),
            toType: "dir"
        }]
    });
}

// examples/ copy
function examplesCopy() {
    return new CopyPlugin({
        patterns: [{
            from: "examples/**/*",
            to: buildPath,
            toType: "dir"
        }]
    });
}

// api/ copy
function apiCopy() {
    return new CopyPlugin({
        patterns: [{
            from: "api/**/*",
            to: buildPath,
            context: "./notebook/",
            toType: "dir"
        }]
    });
}

// static/ copy
function staticCopy() {
    return new CopyPlugin({
        patterns: [{
            from: "static/**/*",
            to: buildPath,
            context: "./notebook/",
            toType: "dir"
        }]
    });
}
/*
function languageSymlinks() {
    return new SymlinkWebpackPlugin([
        { origin: '../python3/index.html', symlink: '../index.html', force: true },
        { origin: '../assets/', symlink: '../python3/assets', force: true },
        { origin: '../assets/', symlink: '../sql/assets', force: true },
        { origin: '../assets/', symlink: '../javascript/assets', force: true },
        { origin: '../python3/', symlink: '../python', force: true },
        { origin: '../javascript/', symlink: '../js', force: true }
    ]);
}
*/
async function main() {
    return {
        entry: "./src/ts/main.ts",
        output: {
            filename: '[name].[contenthash].js',
            chunkFilename: '[name].[contenthash].js',
            path: assetsPath
        },
        module: {
            rules: [
                {
                    test: /\.(woff|woff2|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    use: ['url-loader']
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
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
            modules: ['src/js/', 'node_modules/'],
        },
        plugins: [
            html("python3", "Python 3"),
            //html("javascript", "JavaScript"),
            //html("sql", "SQL"),
            css(),
            await version(),
            //htaccess(),
            python3files(),
            apiCopy(),
            staticCopy(),
            examplesCopy()//,
            //languageSymlinks()
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

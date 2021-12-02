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
const kernelVersion = require(path.join(rootPath, 'package.json')).devDependencies["@basthon/gui-base"];

const languages ={
    "python3": "Python 3",
    "javascript": "JavaScript",
    "sql": "SQL"
};

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

// generate index.html from template src/templates/index.html
function html(language) {
    return new HtmlWebpackPlugin({
        hash: true,
        language: language,
        languageName: languages[language],
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
function htmls() {
    return Object.keys(languages).map(html);
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
            path: assetsPath
        },
        module: {
            rules: [
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
            modules: ['src/ts/', 'src/js/', 'node_modules/'],
        },
        plugins: [
            ...htmls(),
            css(),
            await version(),
            //htaccess(),
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

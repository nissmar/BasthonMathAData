const { merge } = require('webpack-merge');
const base = require('./webpack.base.config.js');

async function main() {
    return merge(await base(), {
        mode: 'development',
        devtool: 'inline-source-map',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
            ]
        },
    });
}

module.exports = main;

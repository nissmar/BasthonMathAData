const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { merge } = require('webpack-merge');
const base = require('./webpack.base.config.js');

async function main() {
    return merge(await base(), {
        mode: 'production',
        devtool: 'source-map',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets:
                            [
                                "@babel/preset-env",
                                "@babel/preset-typescript"
                            ],
                            plugins: ["@babel/plugin-transform-runtime"],
                        },
                    },
                    exclude: /node_modules/
                },
            ]
        },
        optimization: {
            minimizer: [
                "...",
                new CssMinimizerPlugin({
                    minimizerOptions: {
                        preset: [
                            "default",
                            { discardComments: { removeAll: true } },
                        ],
                    }})
            ],
        }
    });
}

module.exports = main;

const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { merge } = require('webpack-merge');
const base = require('./webpack.base.config.js');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

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
                    exclude: /(node_modules|@basthon\/kernel-ocaml\/lib\/__kernel__.js)/
                },
                {
                    test: /\.jsx?$/,
                    use: {
                        loader: 'babel-loader',
                        options: { presets: ["@babel/preset-env"] },
                    },
                    exclude: /node_modules/
                },
            ]
        },
        plugins: [
            new ForkTsCheckerWebpackPlugin({
                typescript: {
                    diagnosticOptions: {
                        semantic: true,
                        syntactic: true,
                    },
                },
            }),
        ],
        optimization: {
            minimize: true,
            minimizer: [
                "...",
                new CssMinimizerPlugin({
                    minimizerOptions: {
                        preset: [
                            "default",
                            { discardComments: { removeAll: true } },
                        ],
                    }
                }),
                new HtmlMinimizerPlugin({
                    minimizerOptions: {
                        collapseWhitespace: false,
                    },
                }),
            ],
        }
    });
}

module.exports = main;

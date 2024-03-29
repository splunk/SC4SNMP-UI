const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const baseConfig = require('@splunk/webpack-configs/base.config').default;

module.exports = webpackMerge(baseConfig, {
    entry: path.join(__dirname, 'demo'),
    output:{
        filename: "[name].js?[chunkhash]"
    },
    resolve:{
        fallback: {
            "querystring": require.resolve("querystring-es3")
        }
    },
    module: {
      rules: [
          { test: /\.(png|woff|woff2|eot|ttf|svg|otf)$/, use: {loader: 'file-loader',}}
      ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            hash: true,
            template: path.join(__dirname, 'standalone/index.html'),
        }),
        new webpack.DefinePlugin({
              'process.env':{
                'REACT_APP_FLASK_PORT': JSON.stringify(process.env.REACT_APP_FLASK_PORT || 5000),
            }
        })
    ],
    devtool: 'eval-source-map'
});

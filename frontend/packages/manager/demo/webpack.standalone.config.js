const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const baseConfig = require('@splunk/webpack-configs/base.config').default;

module.exports = webpackMerge(baseConfig, {
    entry: path.join(__dirname, 'demo'),
    plugins: [
        new HtmlWebpackPlugin({
            hash: true,
            template: path.join(__dirname, 'standalone/index.html'),
        }),
        new webpack.DefinePlugin({
              'process.env':{
                'REACT_APP_FLASK_PORT': JSON.stringify(process.env.REACT_APP_FLASK_PORT || 5000),
                'REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || "not_reading_env")
            }
        })
    ],
    devtool: 'eval-source-map',
});

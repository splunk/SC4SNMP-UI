const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { merge } = require('webpack-merge');
const baseConfig = require('@splunk/webpack-configs/base.config').default;

const isProduction = process.env.NODE_ENV === 'production';

module.exports = merge(baseConfig, {
    entry: path.join(__dirname, 'demo'),
    output:{
        filename: "[name].js?[chunkhash]"
    },
    resolve:{
        fallback: {
            "querystring": require.resolve("querystring-es3")
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            hash: true,
            template: path.join(__dirname, 'standalone/index.html'),
        }),
    ],
    // eval-based source maps would force 'unsafe-eval' in the CSP of the served bundle.
    devtool: isProduction ? false : 'eval-source-map',
    devServer: {
        proxy: [
            {
                context: ['/api'],
                target: `http://localhost:${process.env.REACT_APP_FLASK_PORT || 5000}`,
                pathRewrite: { '^/api': '' },
            },
        ],
    },
    performance: { hints: false }
});

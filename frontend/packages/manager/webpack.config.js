const path = require('path');
const webpackMerge = require('webpack-merge');
const baseComponentConfig = require('@splunk/webpack-configs/component.config').default;

module.exports = webpackMerge(baseComponentConfig, {
    devServer: {
        disableHostCheck: true,
    },
    entry: {
        Manager: [path.join(__dirname, 'src/Manager.jsx')],
    },
    output: {
        path: path.join(__dirname),
    },
});

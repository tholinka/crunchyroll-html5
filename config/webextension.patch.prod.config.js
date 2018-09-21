const webpack = require("webpack");
const common = require('./webextension.patch.config.js');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

common.plugins = [
  new UglifyJSPlugin()
];

common.mode = 'production';

module.exports = common;
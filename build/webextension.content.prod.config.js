const webpack = require("webpack");
const common = require('./webextension.content.config.js');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

common.plugins = [
  new UglifyJSPlugin()
];

module.exports = common;
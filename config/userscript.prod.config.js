const webpack = require("webpack");
const common = require('./userscript.config.js');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

common.plugins = [
  new UglifyJSPlugin(),
  ...common.plugins
];

common.mode = 'production';

module.exports = common;
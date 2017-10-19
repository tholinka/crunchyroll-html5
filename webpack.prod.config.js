const webpack = require("webpack");
const WrapperPlugin = require('wrapper-webpack-plugin');
const package = require('./package.json');
const common = require('./webpack.config.js');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

common.plugins = [
  new UglifyJSPlugin(),
  ...common.plugins
];

module.exports = common;
const webpack = require("webpack");
const WrapperPlugin = require('wrapper-webpack-plugin');
const package = require('./package.json');
const common = require('./webpack.webextension.config.js');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

common.plugins = [
  new UglifyJSPlugin()
];

module.exports = common;
const webpack = require("webpack");
const merge = require('webpack-merge');
const common = require('./webpack.common.config.js');
const path = require('path');

module.exports = merge(common, {
  entry: {
    index: path.join(__dirname, '..', 'src/app/bootstrap.webextension.ts')
  },
  mode: 'development',
  output: {
    filename: 'content-script.js',
    path: path.resolve(__dirname, '..', 'dist', 'webextension')
  }
});
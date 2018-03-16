const webpack = require("webpack");
const merge = require('webpack-merge');
const common = require('./webpack.common.config.js');
const path = require('path');

module.exports = merge(common, {
  entry: {
    index: path.join(__dirname, '..', 'src/app/background/index.ts')
  },
  output: {
    filename: 'background.js',
    path: path.resolve(__dirname, '..', 'dist', 'webextension')
  }
});
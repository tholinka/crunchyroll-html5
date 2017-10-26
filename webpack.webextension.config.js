const webpack = require("webpack");
const WrapperPlugin = require('wrapper-webpack-plugin');
const package = require('./package.json');
const merge = require('webpack-merge');
const common = require('./webpack.common.config.js');
const path = require('path');
const ncp = require('ncp').ncp;

const generateManifest = () => {

};

ncp('./vendor', './dist/webextension/vendor', (err) => {
  if (err) {
    console.error(err);
  }
});

module.exports = merge(common, {
  entry: {
    index: './src/app/bootstrap.webextension.ts'
  },
  output: {
    filename: 'content-script.js',
    path: path.resolve(__dirname, 'dist', 'webextension')
  }
});
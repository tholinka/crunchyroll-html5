const webpack = require("webpack");
const merge = require('webpack-merge');
const common = require('./webpack.common.config.js');
const path = require('path');

module.exports = merge(common, {
  entry: {
    index: path.join(__dirname, '..', 'src/app/bootstrap.webextension.ts')
  },
  plugins: [
    new webpack.DefinePlugin({
      'window.Worker': 'window.MyWorker'
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'string-replace-loader',
        options: {
          search: 'browserCrypto.subtle || browserCrypto.webkitSubtle',
          replace: 'window.wrapCryptoSubtle(browserCrypto.subtle || browserCrypto.webkitSubtle)'
        }
      }
    ],
  },
  mode: 'development',
  devtool: false,
  output: {
    filename: 'content-script.js',
    path: path.resolve(__dirname, '..', 'dist', 'webextension')
  }
});
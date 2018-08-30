const webpack = require("webpack");
const path = require('path');

module.exports = {
  mode: "development",
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  optimization: {
    minimize: false
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          'to-string-loader',
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: (loader) => [
                require('postcss-cssnext')()
              ]
            }
          },
          'sass-loader'
        ]
      }
    ]
  }
};
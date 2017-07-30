var webpack = require("webpack");

module.exports = {
  entry: './app/bootstrap.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  node: {
    net: 'mock',
    tls: 'mock',
    fs: 'empty'
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  output: {
    filename: './dist/bundle.js',
    path: __dirname
  }
};
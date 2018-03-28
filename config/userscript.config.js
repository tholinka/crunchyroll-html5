const webpack = require("webpack");
const WrapperPlugin = require('wrapper-webpack-plugin');
const package = require('../package.json');
const merge = require('webpack-merge');
const common = require('./webpack.common.config.js');
const path = require('path');
const utils = require('../build/utils');

/**
 * Generate the user
 * @param {{[key: string]: string|string[]|undefined|null}} metadata the metadata.
 * @return {string} the metadata block as a string.
 */
const generateMetadataBlock = (metadata) => {
  let block = '';
  for (let key in metadata) {
    if (metadata.hasOwnProperty(key)) {
      let values = metadata[key];
      if (values) {
        if (!Array.isArray(values)) {
          values = [values];
        }
        for (let i = 0; i < values.length; i++) {
          block += '// @' + key + ' ' + values[i] + '\n';
        }
      } else {
        block += '// @' + key + '\n';
      }
    }
  }

  return '// ==UserScript==\n'
    + block
    + '// ==/UserScript==\n\n';
};

const metadata = {
  'name': package['productName'],
  'namespace': 'https://github.com/YePpHa/crunchyroll-html5',
  'description': package['description'],
  'version': package['version'],
  'author': utils.parseAuthor(package['author']),
  'match': [
    'http://www.crunchyroll.com/*',
    'https://www.crunchyroll.com/*'
  ],
  'source': package['repository']['url'],
  'grant': [
    'GM_xmlhttpRequest',
    'GM_getValue',
    'GM_setValue',
    'GM.xmlHttpRequest',
    'GM.getValue',
    'GM.setValue'
  ],
  'connect': '*'
};

module.exports = merge(common, {
  entry: {
    index: path.join(__dirname, '..', 'src/app/bootstrap.userscript.ts')
  },
  output: {
    filename: 'crunchyroll-html5.user.js',
    path: path.resolve(__dirname, '..', 'dist')
  },
  plugins: [
    new WrapperPlugin({
      test: /\.js$/,
      header: generateMetadataBlock(metadata)
    })
  ]
});
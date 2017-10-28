const webpack = require("webpack");
const WrapperPlugin = require('wrapper-webpack-plugin');
const package = require('./package.json');
const merge = require('webpack-merge');
const common = require('./webpack.common.config.js');
const path = require('path');
const ncp = require('ncp').ncp;
const utils = require('./utils');
const fs = require('fs');
const mkdirp = require('mkdirp');

const generateManifest = () => {
  return JSON.stringify({
    'manifest_version': 2,
    'name': package.name,
    'version': package.version,
    'description': package.description,
    'author': utils.parseAuthor(package.author),
    'content_scripts': [
      {
        'matches': [
          '*://www.crunchyroll.com/*'
        ],
        'js': [
          'patch-worker.js',
          'content-script.js'
        ]
      }
    ],
    'web_accessible_resources': [
      'vendor/JavascriptSubtitlesOctopus/*',
      'fonts/*'
    ]
  }, null, 2);
};

mkdirp('./dist/webextension', (err) => {
  if (err) {
    console.error(err);
    return;
  }
  ncp('./vendor', './dist/webextension/vendor', (err) => {
    if (err) {
      console.error(err);
    }
  });

  ncp('./src/fonts', './dist/webextension/fonts', (err) => {
    if (err) {
      console.error(err);
    }
  });
  
  fs.writeFile('./dist/webextension/manifest.json', generateManifest(), (err) => {
    if (err) {
      console.error(err);
    }
  });

  fs.readFile('./vendor/patch-worker.js', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    fs.writeFile('./dist/webextension/patch-worker.js', data, (err) => {
      if (err) {
        console.error(err);
      }
    });
  });
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
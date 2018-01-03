const package = require('../package.json');

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
    'background': {
      'scripts': [
        'vendor/browser-polyfill.min.js',
        'background.js'
      ],
      'persistent': true
    },
    'content_scripts': [
      {
        'matches': [
          '*://www.crunchyroll.com/*'
        ],
        'js': [
          'vendor/browser-polyfill.min.js',
          'patch-worker.js',
          'content-script.js'
        ]
      }, {
        'all_frames': true,
        'matches': [
          '*://www.crunchyroll.com/affiliate_iframeplayer*'
        ],
        'js': [
          'vendor/browser-polyfill.min.js',
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

mkdirp(path.join(__dirname, '../dist/webextension'), (err) => {
  if (err) {
    console.error(err);
    return;
  }
  ncp(path.join(__dirname, '../vendor'), path.join(__dirname, '../dist/webextension/vendor'), (err) => {
    if (err) {
      console.error(err);
    }
  });

  ncp(path.join(__dirname, '../src/fonts'), path.join(__dirname, '../dist/webextension/fonts'), (err) => {
    if (err) {
      console.error(err);
    }
  });
  
  fs.writeFile(path.join(__dirname, '../dist/webextension/manifest.json'), generateManifest(), (err) => {
    if (err) {
      console.error(err);
    }
  });

  fs.readFile(path.join(__dirname, '../vendor/patch-worker.js'), (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    fs.writeFile(path.join(__dirname, '../dist/webextension/patch-worker.js'), data, (err) => {
      if (err) {
        console.error(err);
      }
    });
  });
});
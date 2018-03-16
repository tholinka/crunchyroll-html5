const package = require('../package.json');

const path = require('path');
const ncp = require('ncp').ncp;
const mkdirp = require('mkdirp');

const excludeVendorFilenames = [
  'browser-polyfill.min.js',
  'patch-worker.js'
];

mkdirp(path.join(__dirname, '../dist/firefox/chrome/content'), (err) => {
  if (err) {
    console.error(err);
    return;
  }
  ncp(path.join(__dirname, '../vendor'), path.join(__dirname, '../dist/firefox/chrome/content/vendor'), {
    filter: (filename) => {
      const base = path.resolve(__dirname, '../vendor');
      return (excludeVendorFilenames.indexOf(path.relative(base, filename)) === -1);
    }
  }, (err) => {
    if (err) {
      console.error(err);
    }
  });

  ncp(path.join(__dirname, '../src/fonts'), path.join(__dirname, '../dist/firefox/chrome/content/fonts'), (err) => {
    if (err) {
      console.error(err);
    }
  });
});
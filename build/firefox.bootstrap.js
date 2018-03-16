const package = require('../package.json');

const path = require('path');
const ncp = require('ncp').ncp;
const fs = require('fs');
const mkdirp = require('mkdirp');
const streamReplace = require('stream-replace');

mkdirp(path.join(__dirname, '../dist/firefox'), (err) => {
  if (err) {
    console.error(err);
    return;
  }
  ncp(path.join(__dirname, '../src/firefox-legacy'), path.join(__dirname, '../dist/firefox'), {
    transform: (read, write) => {
      read
        .pipe(streamReplace(/\$\{(.*?)\}/g, (match, name) => {
          if (name in package) {
            return package[name];
          }

          return match;
        }))
        .pipe(write)
    }
  }, (err) => {
    if (err) {
      console.error(err);
    }
  });
});
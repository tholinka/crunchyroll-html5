const package = require('../package.json');

const path = require('path');
const fs = require('fs');
const extra = require('fs-extra');
const mkdirp = require('mkdirp');
const UglifyJS = require('uglify-es');

const excludeVendorFilenames = [
  'browser-polyfill.min.js',
  'patch-worker.js'
];

const includeAssetsFilenames = [
  'icon32.png',
  'icon64.png'
];

mkdirp(path.join(__dirname, '../dist/firefox/chrome/content'), (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
    return;
  }
  var vendorPath = path.join(__dirname, '../vendor');
  var dest = path.join(__dirname, '../dist/firefox/chrome/content/vendor');
  extra.copy(vendorPath, dest, {
    filter: (filename) => {
      const base = path.resolve(__dirname, '../vendor');
      return (excludeVendorFilenames.indexOf(path.relative(base, filename)) === -1);
    }
  }, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    } else {
      var file = "JavascriptSubtitlesOctopus/subtitles-octopus-worker.asm.js";
      fs.readFile(path.join(vendorPath, file), (err, data) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }

        try {
          var result = UglifyJS.minify(data.toString('utf-8'), {
            ecma: 5
          });
        } catch (err) {
          console.error(err);
          process.exit(1);
        }

        fs.writeFile(path.join(dest, file), result.code, (err) => {
          if (err) {
            console.error(err);
            process.exit(1);
          }
        });
      });
    }
  });

  extra.copy(path.join(__dirname, '../src/fonts'), path.join(__dirname, '../dist/firefox/chrome/content/fonts'), (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });

  extra.copy(path.join(__dirname, '../src/assets'), path.join(__dirname, '../dist/firefox/assets'), {
    filter: (filename) => {
      const base = path.resolve(__dirname, '../assets');
      return (includeAssetsFilenames.indexOf(path.relative(base, filename)) !== -1);
    }
  }, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
});
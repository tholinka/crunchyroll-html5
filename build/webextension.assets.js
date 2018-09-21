const package = require('../package.json');

const path = require('path');
const extra = require('fs-extra');
const utils = require('./utils');
const fs = require('fs');
const mkdirp = require('mkdirp');
const UglifyJS = require('uglify-es');

const generateManifest = () => {
  return JSON.stringify({
    'manifest_version': 2,
    'name': package.productName,
    'version': package.version,
    'description': package.description,
    'author': utils.parseAuthor(package.author),
    'icons': {
      '16': 'assets/icon16.png',
      '32': 'assets/icon32.png',
      '48': 'assets/icon48.png',
      '64': 'assets/icon64.png',
      '96': 'assets/icon96.png',
      '128': 'assets/icon128.png'
    },
    'background': {
      'scripts': [
        'vendor/browser-polyfill.min.js',
        'background.js'
      ]
    },
    'content_scripts': [
      {
        'matches': [
          '*://www.crunchyroll.com/*'
        ],
        'js': [
          'vendor/browser-polyfill.min.js',
          'patch.js',
          'content-script.js'
        ],
        "run_at": "document_start" // run as soon as possible, postpone loading in code
      }, {                         // allows for early initialization of some things
        'all_frames': true,
        'matches': [
          '*://www.crunchyroll.com/affiliate_iframeplayer*'
        ],
        'js': [
          'vendor/browser-polyfill.min.js',
          'patch.js',
          'content-script.js'
        ]
      }
    ],
    'web_accessible_resources': [
      'vendor/JavascriptSubtitlesOctopus/*',
      'fonts/*'
    ],
    'permissions': [
      "storage",
      "*://www.crunchyroll.com/*",

      // Allow the player to access these sites as otherwise it will have some
      // trouble loading the video.
      "*://*.vrv.co/*",
      "*://*.dlvr1.net/*",
      "*://*.akamaized.net/*"
    ]
  }, null, 2);
};

mkdirp(path.join(__dirname, '../dist/webextension'), (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
    return;
  }
  var vendorPath = path.join(__dirname, '../vendor');
  var dest = path.join(__dirname, '../dist/webextension/vendor');
  extra.copy(vendorPath, dest, {
    filter: (filename) => !filename.match(/subtitles-octopus-worker\.asm\.js$/g)
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

  extra.copy(path.join(__dirname, '../src/fonts'), path.join(__dirname, '../dist/webextension/fonts'), (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });

  extra.copy(path.join(__dirname, '../src/assets'), path.join(__dirname, '../dist/webextension/assets'), (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
  
  fs.writeFile(path.join(__dirname, '../dist/webextension/manifest.json'), generateManifest(), (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
});
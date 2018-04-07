const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '../dist');

const output = fs.createWriteStream(path.join(dist, '/firefox.xpi'));
const archive = archiver('zip', {
  zlib: { level: 9 }
});
archive.pipe(output);
archive.directory(path.join(dist, 'firefox'), false);
archive.finalize();
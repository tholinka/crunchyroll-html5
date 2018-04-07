const signAddon = require("sign-addon").default;
const path = require("path");
const argv = require('yargs')
  .option('id', {
    alias: 'i',
    type: 'string',
    demandOption: true
  })

  .option('key', {
    alias: 'k',
    type: 'string',
    demandOption: true
  })
  .option('secret', {
    alias: 's',
    type: 'string',
    demandOption: true
  })
  .argv;

const id = argv.id ? argv.id : undefined;
const apiKey = argv.key;
const apiSecret = argv.secret;

var package = require("../package.json");

signAddon({
  xpiPath: path.join(__dirname, "../dist/webextension.zip"),
  version: package.version,
  id: id,
  apiKey: apiKey,
  apiSecret: apiSecret,
  downloadDir: path.join(__dirname, "../dist")
})
.then(function(result) {
  if (result.success) {
    console.log("The following signed files were downloaded:");
    console.log(result.downloadedFiles);
    console.log("Your extension ID is:");
    console.log(result.id);
  } else {
    console.error("Your add-on could not be signed!");
    console.error("Check the console for details.");
  }
  console.log(result.success ? "SUCCESS" : "FAIL");
})
.catch(function(error) {
  console.error("Signing error:", error);
});
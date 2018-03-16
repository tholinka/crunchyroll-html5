const { filename, whitelist, blacklist } = require("data");

var modules = {}; // The loaded modules (alike CommonJS)

function loadFile(scriptName) {
  let request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
  request.open("GET", scriptName, true);
  request.overrideMimeType("text/plain");
  request.send(null);
  
  return request.responseText;
}

/* Require a library file (alike CommonJS) */
function require(module) {
  if (!(module in modules)) {
    let principal = Components.classes["@mozilla.org/systemprincipal;1"].getService(Components.interfaces.nsIPrincipal);
    let url = "resource://ytcenter/libs/" + module + ".js";
    modules[module] = Components.utils.Sandbox(principal, {
      sandboxName: url,
      sandboxPrototype: {
        inFrameScript: true,
        require: require,
        exports: {},
        Cc: Components.classes,
        Ci: Components.interfaces,
        Cr: Components.results,
        Cu: Components.utils,
        Worker: Worker
      },
      wantXrays: false
    });
    Services.scriptloader.loadSubScript(url, modules[module]);
  }
  return modules[module].exports;
}

function init() {
  let {ContentService} = require("service/ContentService");
  
  let service = new ContentService(whitelist, blacklist, filename, loadFile(filename));
  service.init();
}

init();
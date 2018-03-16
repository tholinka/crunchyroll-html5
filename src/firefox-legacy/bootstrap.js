const Cc = Components.classes
    , Ci = Components.interfaces
    , Cr = Components.results
    , Cu = Components.utils;

const { Services } = Cu.import("resource://gre/modules/Services.jsm", null);

const alias = "crunchyroll-html5";

// The loaded modules
const modules = {};

/**
 * Require a module
 * @param {!string} name the module name.
 */
function require(name) {
  if (!(name in modules)) {
    const principal = Cc["@mozilla.org/systemprincipal;1"].getService(Ci.nsIPrincipal);
    const url = "resource://crunchyroll-html5/modules/" + name + ".js";
    modules[name] = Cu.Sandbox(principal, {
      sandboxName: url,
      sandboxPrototype: {
        inFrameScript: false,
        require: require,
        exports: {},
        Cc: Cc,
        Ci: Ci,
        Cr: Cr,
        Cu: Cu,
        Worker: Worker
      },
      wantXrays: false
    });
    Services.scriptloader.loadSubScript(url, modules[name]);
  }

  return modules[name].exports;
}

function createResourceAlias(aData, subAlias) {
  let resource = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
  let alias = Services.io.newFileURI(aData.installPath);
  if (!aData.installPath.isDirectory())
    alias = Services.io.newURI("jar:" + alias.spec + "!/", null, null);
  resource.setSubstitution(subAlias, alias);
}

function removeResourceAlias(subAlias) {
  let resource = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
  resource.setSubstitution(subAlias, null);
}

/* On add-on startup */
function startup(data, reason) {
  addonData = data;
  createResourceAlias(addonData, alias);
  
  Services.tm.currentThread.dispatch(function() {
    const service = require("service/StartupService");

    (new service.StartupService()).init();
  }, Ci.nsIEventTarget.DISPATCH_NORMAL);
}

/* On add-on shutdown */
function shutdown(data, reason) {
  if (reason === APP_SHUTDOWN)
    return;
  
  require("unload").shutdown();
  
  /* Remove all the loaded modules and their exported variables */
  for (let key in modules) {
    let module = modules[key];
    if ("nukeSandbox" in Cu) {
      Cu.nukeSandbox(module);
    } else {
      for (let v in module) {
        module[v] = null;
      }
    }
  }
  
  modules = null; // Remove all references to the module
  
  removeResourceAlias(alias);
}

/* On add-on install */
function install(data, reason) { }

/* On add-on uninstall */
function uninstall(data, reason) { }
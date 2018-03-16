Cu.import("resource://gre/modules/Services.jsm");

const { getFirebugConsole } = require("utils")
    , { request } = require("request")
    , { CustomWorker } = require("worker")
    , { patchWorker } = require("data")
    , window = require("window");

function sandboxUnloader(win, sandbox) {
  if (sandbox) {
    try {
      if ("nukeSandbox" in Cu) {
        Cu.nukeSandbox(sandbox);
      } else {
        for (let v in sandbox) {
          try {
            sandbox[v] = null;
          } catch (e) {
            Cu.reportError(e);
          }
        }
      }
    } catch (e) {
      Cu.reportError(e);
    }
  }
}

function createSandbox(wrappedContentWin) {
  let sandbox = new Cu.Sandbox(
    wrappedContentWin, {
      "sameZoneAs": wrappedContentWin,
      "sandboxName": "Crunchyroll HTML5",
      "sandboxPrototype": wrappedContentWin,
      "wantXrays": true,
      "wantExportHelpers": true
    }
  );
  
  sandbox.GM_xmlhttpRequest = Cu.cloneInto(request.bind(this, wrappedContentWin, sandbox), sandbox, { cloneFunctions: true, wrapReflectors: true });
  sandbox.CustomWorker = Cu.cloneInto(CustomWorker.bind(this, wrappedContentWin, sandbox), sandbox, { cloneFunctions: true, wrapReflectors: true });

  // Make sure that everything is properly unloaded
  window.addEventListener(wrappedContentWin, "unload", sandboxUnloader.bind(this, wrappedContentWin, sandbox));
  
  return sandbox;
}

function isRunnable(url, whitelist, blacklist) {
  for (var i = 0; i < blacklist.length; i++) {
    if (blacklist[i].test(url + "/")) {
      return false;
    }
  }
  for (var i = 0; i < whitelist.length; i++) {
    if (whitelist[i].test(url + "/")) {
      return true;
    }
  }
  return false;
}

function load(content, sandbox, filename) {
  if (content.length > 0) {
    return Cu.evalInSandbox(content, sandbox, "ECMAv5", filename, 0);
  } else {
    return Services.scriptloader.loadSubScript(filename, sandbox, "UTF-8");
  }
}

function loadScript(whitelist, blacklist, filename, content, wrappedContentWin, url) {
  if (isRunnable(url, whitelist, blacklist)) {
    let sandbox = createSandbox(wrappedContentWin);
    
    load(content, sandbox, patchWorker);
    load(content, sandbox, filename);
  }
}

exports["loadScript"] = loadScript;
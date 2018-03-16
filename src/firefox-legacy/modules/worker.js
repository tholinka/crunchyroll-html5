const { onUnload } = require("unload");

function CustomWorker(wrappedContentWin, sandbox, scriptUrl) {
  const worker = new Worker(scriptUrl);
  worker.onmessage = function(e) {
    const obj = Cu.waiveXrays(shim);
    if (obj.onmessage) {
      e = Cu.cloneInto({
        data: e.data
      }, sandbox, { cloneFunctions: true, wrapReflectors: true });

      obj.onmessage(e);
    }
  };
  worker.onerror = function(e) {
    const obj = Cu.waiveXrays(shim);
    if (obj.onerror) {
      e = Cu.cloneInto({
        error: e.error
      }, sandbox, { cloneFunctions: true, wrapReflectors: true });

      obj.onerror(e);
    }
  };

  onUnload(function() {
    worker.terminate();
  });

  let shim = Cu.cloneInto({
    postMessage: worker.postMessage.bind(worker),
    addEventListener: worker.addEventListener.bind(worker),
    removeEventListener: worker.removeEventListener.bind(worker),
    dispatchEvent: worker.dispatchEvent.bind(worker),
    terminate: worker.terminate.bind(worker),
    onerror: null,
    onmessage: null
  }, sandbox, { cloneFunctions: true, wrapReflectors: true });;

  return shim;
}

exports["CustomWorker"] = CustomWorker;
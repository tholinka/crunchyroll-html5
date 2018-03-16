/** @type {!Array<Function>} */
const callbacks = [];

/**
 * @param {!Function} callback the callback to call when unloading
 */
exports["onUnload"] = function(callback) {
  callbacks.push(callback);
};

exports["shutdown"] = function() {
  let cb;
  while (cb = callbacks.shift()) {
    cb();
  }
};
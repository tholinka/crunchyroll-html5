(function() {
  'use strict';
  var Worker_ = window.Worker;

  window.Worker = function Worker(scriptURL) {
    if (arguments.length === 0) {
      throw new TypeError('Not enough arguments');
    }
    if (scriptURL.indexOf("chrome://crunchyroll-html5/content") === 0) {
      return new CustomWorker(scriptURL);
    }
    return new Worker_(scriptURL);
  };
})();
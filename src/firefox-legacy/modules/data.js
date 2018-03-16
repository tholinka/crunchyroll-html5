exports["filename"] = "resource://crunchyroll-html5/data/content-script.js";
exports["patchWorker"] = "resource://crunchyroll-html5/chrome/content/vendor/patch-worker.firefox.js";


exports["whitelist"] = [ /https?:\/\/(?:(www|m)\.)?(crunchyroll\.(?:com|fr)\/(?:media(?:-|\/\?id=)|[^/]*\/[^/?&]*?)([0-9]+))(?:[/?&]|$)/g, /^https?:\/\/(?:(?:www|m)\.)?(?:crunchyroll\.(?:com|fr))\/affiliate_iframeplayer\?/g ];
exports["blacklist"] = [ ];
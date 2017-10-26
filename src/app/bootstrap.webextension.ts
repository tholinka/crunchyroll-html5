import { binaryToBlob } from "./utils/blob";
import { addFile, setWorkerUrl } from "./SubtitleEngineLoader";
import { run } from './bootstrap';

function getURL(path: string): string {
  if (chrome && chrome.extension && typeof chrome.extension.getURL === "function") {
    return chrome.extension.getURL(path);
  } else if (browser && browser.extension && typeof browser.extension.getURL === "function") {
    return browser.extension.getURL(path);
  } else {
    throw new Error("Browser doesn't browser or chrome (see https://developer.mozilla.org/en-US/Add-ons/WebExtensions).");
  }
}

const workerUrl = getURL('/vendor/JavascriptSubtitlesOctopus/subtitles-octopus-worker.js');
const defaultFile = getURL('/vendor/JavascriptSubtitlesOctopus/default.ttf');
const fontFile = getURL('/vendor/JavascriptSubtitlesOctopus/fonts.conf');

setWorkerUrl(workerUrl);

addFile('default.ttf', defaultFile);
addFile('fonts.conf', fontFile);

run();
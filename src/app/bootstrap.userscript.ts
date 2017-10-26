import { binaryToBlob } from "./utils/blob";
import { addFile, setWorkerUrl } from "./SubtitleEngineLoader";
import { run } from './bootstrap';

const libassWorkerJS = require('raw-loader!../../vendor/JavascriptSubtitlesOctopus/subtitles-octopus-worker.js');
const libassDefaultFont = require('binary-loader!../../vendor/JavascriptSubtitlesOctopus/default.ttf');
const libassFontsConfig = require('raw-loader!../../vendor/JavascriptSubtitlesOctopus/fonts.conf');

const libassWorkerUrl = URL.createObjectURL(new Blob([libassWorkerJS], { type: "text/javascript" }));
const libassDefaultFontUrl = URL.createObjectURL(binaryToBlob(libassDefaultFont, "application/octet-stream"));
const libassFontsConfigUrl = URL.createObjectURL(new Blob([libassFontsConfig], { type: "application/xml" }));

setWorkerUrl(libassWorkerUrl);

addFile('default.ttf', libassDefaultFontUrl);
addFile('fonts.conf', libassFontsConfigUrl);

run();
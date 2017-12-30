import { binaryToBlob } from "./utils/blob";
import { addFile, setWorkerUrl, fonts } from "./SubtitleEngineLoader";
import { run } from './bootstrap';

const libassWorkerJS = require('raw-loader!../../vendor/JavascriptSubtitlesOctopusAsm/subtitles-octopus-worker.js');
const libassDefaultFont = require('binary-loader!../../vendor/JavascriptSubtitlesOctopus/default.ttf');
const libassFontsConfig = require('raw-loader!../../vendor/JavascriptSubtitlesOctopus/fonts.conf');

const libassWorkerUrl = URL.createObjectURL(new Blob([libassWorkerJS], { type: "text/javascript" }));
const libassDefaultFontUrl = URL.createObjectURL(binaryToBlob(libassDefaultFont, "application/octet-stream"));
const libassFontsConfigUrl = URL.createObjectURL(new Blob([libassFontsConfig], { type: "application/xml" }));

setWorkerUrl(libassWorkerUrl);

addFile('default.ttf', libassDefaultFontUrl);
addFile('fonts.conf', libassFontsConfigUrl);

/*const arial = require('raw-loader!../fonts/arial.ttf');
const arialbd = require('raw-loader!../fonts/arialbd.ttf');
const arialbi = require('raw-loader!../fonts/arialbi.ttf');
const ariali = require('raw-loader!../fonts/ariali.ttf');
const ariblk = require('raw-loader!../fonts/ariblk.ttf');

const times = require('raw-loader!../fonts/times.ttf');
const timesbd = require('raw-loader!../fonts/timesbd.ttf');
const timesbi = require('raw-loader!../fonts/timesbi.ttf');
const timesi = require('raw-loader!../fonts/timesi.ttf');

const trebuc = require('raw-loader!../fonts/trebuc.ttf');
const trebucbd = require('raw-loader!../fonts/trebucbd.ttf');
const trebucbi = require('raw-loader!../fonts/trebucbi.ttf');
const trebucit = require('raw-loader!../fonts/trebucit.ttf');

// Arial
fonts.push(
  URL.createObjectURL(new Blob([arial], { type: "text/javascript" })),
  URL.createObjectURL(new Blob([arialbd], { type: "text/javascript" })),
  URL.createObjectURL(new Blob([arialbi], { type: "text/javascript" })),
  URL.createObjectURL(new Blob([ariali], { type: "text/javascript" })),
  URL.createObjectURL(new Blob([ariblk], { type: "text/javascript" }))
);

// Times New Roman
fonts.push(
  URL.createObjectURL(new Blob([times], { type: "text/javascript" })),
  URL.createObjectURL(new Blob([timesbd], { type: "text/javascript" })),
  URL.createObjectURL(new Blob([timesbi], { type: "text/javascript" })),
  URL.createObjectURL(new Blob([timesi], { type: "text/javascript" }))
);

// Trebuchet MS
fonts.push(
  URL.createObjectURL(new Blob([trebuc], { type: "text/javascript" })),
  URL.createObjectURL(new Blob([trebucbd], { type: "text/javascript" })),
  URL.createObjectURL(new Blob([trebucbi], { type: "text/javascript" })),
  URL.createObjectURL(new Blob([trebucit], { type: "text/javascript" }))
);*/

run();
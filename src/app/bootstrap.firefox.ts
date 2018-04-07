import { binaryToBlob } from "./utils/blob";
import { addFile, setWorkerUrl, fonts } from "./SubtitleEngineLoader";
import { run } from './bootstrap';
import { BackgroundHttpClient } from "./http/BackgroundHttpClient";
import { setCrossHttpClient } from "./config";
import { GreasemonkeyHttpClient } from "./http/GreasemonkeyHttpClient";
import { ProxyLoaderGreasemonkey } from "./libs/http/greasemonkey/ProxyLoaderGreasemonkey";
import { setPlaylistLoader } from "./playlistLoader";
import { LocalStorageMechanism } from "./storage/mechanism/LocalStorageMechanism";
import { IMechanismSymbol, IMechanism } from "./storage/mechanism/IMechanism";
import container from "../config/inversify.config";
import { EmptyMechanism } from "./storage/mechanism/EmptyMechanism";

function getURL(path: string): string {
  return "chrome://crunchyroll-html5/content" + path;
}

setCrossHttpClient(GreasemonkeyHttpClient);

setPlaylistLoader(ProxyLoaderGreasemonkey);

const workerUrl = getURL('/vendor/JavascriptSubtitlesOctopus/subtitles-octopus-worker.js');
const defaultFile = getURL('/vendor/JavascriptSubtitlesOctopus/default.ttf');
const fontFile = getURL('/vendor/JavascriptSubtitlesOctopus/fonts.conf');

setWorkerUrl(workerUrl);

addFile('default.ttf', defaultFile);
addFile('fonts.conf', fontFile);

const arial = getURL('/fonts/arial.ttf');
const arialbd = getURL('/fonts/arialbd.ttf');
const arialbi = getURL('/fonts/arialbi.ttf');
const ariali = getURL('/fonts/ariali.ttf');
const ariblk = getURL('/fonts/ariblk.ttf');

const times = getURL('/fonts/times.ttf');
const timesbd = getURL('/fonts/timesbd.ttf');
const timesbi = getURL('/fonts/timesbi.ttf');
const timesi = getURL('/fonts/timesi.ttf');

const trebuc = getURL('/fonts/trebuc.ttf');
const trebucbd = getURL('/fonts/trebucbd.ttf');
const trebucbi = getURL('/fonts/trebucbi.ttf');
const trebucit = getURL('/fonts/trebucit.ttf');

// Arial
fonts.push(arial, arialbd, arialbi, ariali, ariblk);

// Times New Roman
fonts.push(times, timesbd, timesbi, timesi);

// Trebuchet MS
fonts.push(trebuc, trebucbd, trebucbi, trebucit);

async function main() {
  if (await LocalStorageMechanism.isAvailable()) {
    container.bind<IMechanism>(IMechanismSymbol).to(LocalStorageMechanism);
  } else {
    // No storage mechanism is available
    container.bind<IMechanism>(IMechanismSymbol).to(EmptyMechanism);
  }

  run();
}

main();
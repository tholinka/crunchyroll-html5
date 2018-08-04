import { binaryToBlob } from "./utils/blob";
import { addFile, setWorkerUrl } from "./SubtitleEngineLoader";
import { runBootstrap } from './bootstrap';
import { setCrossHttpClient } from "./config";
import { GreasemonkeyHttpClient } from "./http/GreasemonkeyHttpClient";
import { setPlaylistLoader } from "./playlistLoader";
import { ProxyLoaderGreasemonkey } from "./libs/http/greasemonkey/ProxyLoaderGreasemonkey";
import container from "../config/inversify.config";
import { IMechanism, IMechanismSymbol } from "./storage/mechanism/IMechanism";
import { GreasemonkeyMechanism } from "./storage/mechanism/GreasemonkeyMechanism";
import { LegacyGreasemonkeyMechanism } from "./storage/mechanism/LegacyGreasemonkeyMechanism";
import { LocalStorageMechanism } from "./storage/mechanism/LocalStorageMechanism";
import { EmptyMechanism } from "./storage/mechanism/EmptyMechanism";

setCrossHttpClient(GreasemonkeyHttpClient);

setPlaylistLoader(ProxyLoaderGreasemonkey);

const libassWorkerJS = require('raw-loader!../../vendor/JavascriptSubtitlesOctopusAsm/subtitles-octopus-worker.js');
const libassDefaultFont = require('binary-loader!../../vendor/JavascriptSubtitlesOctopus/default.ttf');
const libassFontsConfig = require('raw-loader!../../vendor/JavascriptSubtitlesOctopus/fonts.conf');

const libassWorkerUrl = URL.createObjectURL(new Blob([libassWorkerJS], { type: "text/javascript" }));
const libassDefaultFontUrl = URL.createObjectURL(binaryToBlob(libassDefaultFont, "application/octet-stream"));
const libassFontsConfigUrl = URL.createObjectURL(new Blob([libassFontsConfig], { type: "application/xml" }));

setWorkerUrl(libassWorkerUrl);

addFile('default.ttf', libassDefaultFontUrl);
addFile('fonts.conf', libassFontsConfigUrl);

async function main() {
  if (await LegacyGreasemonkeyMechanism.isAvailable()) {
    container.bind<IMechanism>(IMechanismSymbol).to(LegacyGreasemonkeyMechanism);
  } else if (await GreasemonkeyMechanism.isAvailable()) {
    container.bind<IMechanism>(IMechanismSymbol).to(GreasemonkeyMechanism);
  } else if (await LocalStorageMechanism.isAvailable()) {
    container.bind<IMechanism>(IMechanismSymbol).to(LocalStorageMechanism);
  } else {
    // No storage mechanism is available
    container.bind<IMechanism>(IMechanismSymbol).to(EmptyMechanism);
  }

  runBootstrap();
}

main();
import { importCSS, importCSSByUrl } from './utils/css';
import { h, render } from 'preact';
import { PlayerController, IPlayerControllerOptions } from './player/PlayerController';
import { getMediaId, getSelectedQuality, getStartTime, getAutoPlay, updateQualitySettings } from './player/StandardPlayer';
import { parseUrlFragments } from './player/AffiliatePlayer';
import { Formats, FORMAT_IDS } from 'crunchyroll-lib/media';
import container from 'crunchyroll-lib/config';
import { bindCrossHttpClientAsDefault } from './config';
import { ReadyStateChange, ReadyStateChangeEvent, ReadyState } from './libs/ReadyStateChange';
import { EventHandler } from './libs/events/EventHandler';

const css = require('../styles/bootstrap.scss');

const eventHandler = new EventHandler();
let timer: number|undefined;

const readyStateChange = new ReadyStateChange(document);
readyStateChange.listen('readystatechange', (e: ReadyStateChangeEvent) => {
  switch (e.readyState) {
    case ReadyState.Interactive:
      _runOnInteractive();

      // Dispose event handler and interval
      eventHandler.dispose();
      window.clearInterval(timer);

      break;
  }
}, false);

export function runBootstrap() {
  // Update ready state change
  readyStateChange.tick();

  // If not complete add listener and set interval to call tick again later
  const currentReadyState = readyStateChange.getCurrentReadyState();
  if (currentReadyState === undefined || currentReadyState < ReadyState.Interactive) {
    eventHandler.listen(document, 'readystatechange', () => readyStateChange.tick(), false);
    window.setInterval(() => readyStateChange.tick(), 100);
  }
}

async function _runOnInteractive() {
  const url = window.location.href;

  await updateQualitySettings();

  // Configure the default media options
  let mediaId = getMediaId(url);
  const options = {
    sizeEnabled: true,
    autoPlay: true
  } as IPlayerControllerOptions;

  if (mediaId) {
    const quality = getSelectedQuality();
    if (!quality || !(quality in FORMAT_IDS)) return;
    options.quality = quality as keyof Formats;
    options.startTime = getStartTime(url);
    options.autoPlay = getAutoPlay(url);
  } else {
    const affiliate = parseUrlFragments(url);
    if (!affiliate) return;

    mediaId = affiliate.mediaId;
    options.affiliateId = affiliate.affiliateId;
    options.autoPlay = affiliate.autoPlay;
    options.startTime = affiliate.startTime;
    options.sizeEnabled = false;
    options.mediaFormat = affiliate.videoFormat;
    options.mediaQuality = affiliate.videoQuality;

    // Use cross HttpClient when going through affiliate
    bindCrossHttpClientAsDefault();
  }

  // Start the player
  (new Bootstrap()).run(mediaId, options);
}

class Bootstrap {
  private _wrapper: Element;

  constructor() {
    let wrapper = document.querySelector("#showmedia_video_box");
    if (!wrapper) {
      wrapper = document.querySelector("#showmedia_video_box_wide");
    }
    if (!wrapper && document.querySelector("#content > #the_embedded_player")) {
      wrapper = document.querySelector("#content");
    }
    if (!wrapper) throw new Error("Not able to find video wrapper.");
    this._wrapper = wrapper;
    this._wrapper.innerHTML = "";

    importCSSByUrl("https://fonts.googleapis.com/css?family=Noto+Sans");
    importCSS(css);
  }

  async run(mediaId: number, options?: IPlayerControllerOptions) {
    this._wrapper.innerHTML = "";

    const player = new PlayerController(this._wrapper, window.location.href, mediaId, options);
    player.render();
  }
}
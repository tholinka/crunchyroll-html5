import { importCSS, importCSSByUrl } from './utils/css';
import { h, render } from 'preact';
import { PlayerController, IPlayerControllerOptions } from './player/PlayerController';
import { getMediaId, getSelectedQuality, getStartTime, getAutoPlay } from './player/StandardPlayer';
import { parseUrlFragments } from './player/AffiliatePlayer';
import { Formats, FORMAT_IDS } from 'crunchyroll-lib/media';
import container from 'crunchyroll-lib/config';
import { BackgroundHttpClient } from './http/BackgroundHttpClient';
import { bindCrossHttpClientAsDefault } from './config';

const css = require('../styles/bootstrap.scss');

export function run() {
  if (document.readyState === "complete") {
    _run();
  } else {
    const fn = function() {
      if (document.readyState === "complete") {
        document.removeEventListener("readystatechange", fn, false);
        _run();
      }
    };
    document.addEventListener("readystatechange", fn, false);
  }
}

function _run() {
  const url = window.location.href;

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

  (new Bootstrap()).run(mediaId, options);
}

class Bootstrap {
  private _wrapper: Element;

  constructor() {
    let wrapper = document.querySelector("#showmedia_video_box");
    if (!wrapper) {
      wrapper = document.querySelector("#showmedia_video_box_wide");
    }
    if (!wrapper) {
      wrapper = document.querySelector("#content");
    }
    if (!wrapper) throw new Error("Not able to find video wrapper.");
    this._wrapper = wrapper;
    this._wrapper.textContent = "Loading HTML5 player...";

    importCSSByUrl("https://fonts.googleapis.com/css?family=Noto+Sans");
    importCSS(css);
  }

  async run(mediaId: string, options?: IPlayerControllerOptions) {
    this._wrapper.innerHTML = "";

    const player = new PlayerController(this._wrapper, window.location.href, mediaId, options);
    player.render();
  }
}
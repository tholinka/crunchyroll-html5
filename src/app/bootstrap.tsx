import { importCSS, importCSSByUrl } from './utils/css';
import { h, render } from 'preact';
import { PlayerController, IPlayerControllerOptions } from './player/PlayerController';
import { getMediaId, getSelectedQuality, getStartTime, getAutoPlay, updateQualitySettings } from './player/StandardPlayer';
import { parseUrlFragments } from './player/AffiliatePlayer';
import { Formats, FORMAT_IDS } from 'crunchyroll-lib/media';
import container from 'crunchyroll-lib/config';
import { bindCrossHttpClientAsDefault } from './config';

const css = require('../styles/bootstrap.scss');

// Values indicate order of execution
const enum DocumentLoadState {
  NotRun = 0,
  Loading = 1,
  Interactive = 2,
  Complete = 3
}
const DocumentLoadStateMap: {[key: string]: DocumentLoadState} = 
  {
    "loading": DocumentLoadState.Loading, 
    "interactive": DocumentLoadState.Interactive,
    "complete": DocumentLoadState.Complete
  };

export function run() {
  async function readyState() {
    let state = DocumentLoadStateMap[document.readyState];
    await ensureStateRun(state);
    if (state !== DocumentLoadState.Complete) { // not complete
      // register event handler
      document.addEventListener("readystatechange", readyState, false);
    } else {
      // delete event handler
      document.removeEventListener("readystatechange", readyState, false);
    }
  }
  
  readyState();
}

let bootstrapper: Bootstrap;

let hightestRunState: DocumentLoadState = DocumentLoadState.NotRun;
async function ensureStateRun(state: DocumentLoadState) { // Ensure at any given stage some subset of the initializers have run
  async function runState(state: DocumentLoadState) {
    switch (state) {
      case DocumentLoadState.Loading: // a.k.a document_start
        // here we can do something like start looking up the show in MAL or other tracker/databases
        break;
      case DocumentLoadState.Interactive: // a.k.a document_end
        await updateQualitySettings();
        bootstrapper = new Bootstrap();
        break;
      case DocumentLoadState.Complete: // a.k.a document_idle
        _run();
        break;
    }
  }
  
  let statenum = state as number;
  let hightestStatenum = hightestRunState as number;
  if (statenum > hightestStatenum) { // numbers still needed to ensure order
    for (let i = hightestStatenum+1; i <= statenum; i++) {
      await runState(i as DocumentLoadState);
    }
    hightestRunState = statenum;
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

  bootstrapper.run(mediaId, options);
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
    render((
      <div class="html5-loading-text">Loading HTML5 player...</div>
    ), this._wrapper);

    importCSSByUrl("https://fonts.googleapis.com/css?family=Noto+Sans");
    importCSS(css);
  }

  async run(mediaId: number, options?: IPlayerControllerOptions) {
    this._wrapper.innerHTML = "";

    const player = new PlayerController(this._wrapper, window.location.href, mediaId, options);
    player.render();
  }
}
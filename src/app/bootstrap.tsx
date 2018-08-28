import { FORMAT_IDS, Formats } from 'crunchyroll-lib/media';
import container from '../config/inversify.config';
import { bindCrossHttpClientAsDefault } from './config';
import { EventHandler } from './libs/events/EventHandler';
import { ReadyState } from './libs/ReadyState';
import { ReadyStateChange } from './libs/ReadyStateChange';
import { ReadyStateChangeEvent } from './libs/ReadyStateChangeEvent';
import { parseUrlFragments } from './player/AffiliatePlayer';
import {
  IPlayerControllerOptions,
  PlayerController
} from './player/PlayerController';
import {
  getAutoPlay,
  getMediaId,
  getQualitySettings,
  getStartTime,
  updateSelectedElement
} from './player/StandardPlayer';
import { IStorage, IStorageSymbol } from './storage/IStorage';
import { importCSS, importCSSByUrl } from './utils/css';

const css = require('../styles/bootstrap.scss');

const eventHandler = new EventHandler();
let timer: number | undefined;

const readyStateChange = new ReadyStateChange(document);
readyStateChange.listen(
  'readystatechange',
  (e: ReadyStateChangeEvent) => {
    switch (e.readyState) {
      case ReadyState.Interactive:
        _runOnInteractive();

        // Dispose event handler and interval
        eventHandler.dispose();
        window.clearInterval(timer);

        break;
    }
  },
  false
);

export function runBootstrap() {
  // Update ready state change
  readyStateChange.tick();

  // If not complete add listener and set interval to call tick again later
  const currentReadyState = readyStateChange.getCurrentReadyState();
  if (
    currentReadyState === undefined ||
    currentReadyState < ReadyState.Interactive
  ) {
    eventHandler.listen(
      document,
      'readystatechange',
      () => readyStateChange.tick(),
      false
    );
    timer = window.setInterval(() => readyStateChange.tick(), 100);
  }
}

function updateSize(large: boolean) {
  const showmedia = document.querySelector('#showmedia');
  const showmediaVideo = document.querySelector('#showmedia_video');
  const mainMedia = document.querySelector('#main_content');
  const wrapper = getWrapper();
  if (!showmedia || !showmediaVideo || !mainMedia || !wrapper) return;

  if (large) {
    wrapper.setAttribute('id', 'showmedia_video_box_wide');
    wrapper.classList.remove('xsmall-margin-bottom');
    mainMedia.classList.remove('new_layout');
    showmedia.parentElement!.classList.add('new_layout');
    showmedia.parentElement!.classList.add('new_layout_wide');
    showmedia.parentNode!.insertBefore(showmediaVideo, showmedia);
  } else {
    wrapper.setAttribute('id', 'showmedia_video_box');
    wrapper.classList.add('xsmall-margin-bottom');
    showmedia.parentElement!.classList.remove('new_layout');
    showmedia.parentElement!.classList.remove('new_layout_wide');
    mainMedia.classList.add('new_layout');
    if (mainMedia.childNodes.length === 0) {
      mainMedia.appendChild(showmediaVideo);
    } else {
      mainMedia.insertBefore(showmediaVideo, mainMedia.childNodes[0]);
    }
  }
}

async function _runOnInteractive() {
  const url = window.location.href;

  const quality = await getQualitySettings();
  if (quality) {
    updateSelectedElement(quality);
  }

  const storage = container.get<IStorage>(IStorageSymbol);
  const large = await storage.get<boolean>('large');

  if (large !== undefined) {
    updateSize(large);
  }

  // Configure the default media options
  let mediaId = getMediaId(url);
  const options = {
    sizeEnabled: true,
    autoPlay: true
  } as IPlayerControllerOptions;

  if (mediaId) {
    if (quality && quality in FORMAT_IDS) {
      options.quality = quality as keyof Formats;
    }
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
  new Bootstrap().run(mediaId, options);
}

function getWrapper(): Element | undefined {
  let wrapper = document.querySelector('#showmedia_video_box');
  if (!wrapper) {
    wrapper = document.querySelector('#showmedia_video_box_wide');
  }
  if (!wrapper && document.querySelector('#content > #the_embedded_player')) {
    wrapper = document.querySelector('#content');
  }

  return wrapper || undefined;
}

class Bootstrap {
  private _wrapper: Element;
  private _originalHTML: string;

  constructor() {
    const wrapper = getWrapper();
    if (!wrapper) throw new Error('Not able to find video wrapper.');
    this._wrapper = wrapper;
    this._originalHTML = this._wrapper.innerHTML;
    this._wrapper.innerHTML = '';

    importCSSByUrl('https://fonts.googleapis.com/css?family=Noto+Sans');
    importCSS(css);
  }

  public async run(mediaId: number, options?: IPlayerControllerOptions) {
    this._wrapper.innerHTML = '';

    const player = new PlayerController(
      container,
      this._wrapper,
      window.location.href,
      this._originalHTML,
      mediaId,
      options
    );
    player.render();
  }
}

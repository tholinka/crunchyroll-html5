import { h, Component, render } from 'preact';
import { ChromelessPlayer } from './ChromelessPlayer';
import { HlsSource } from './HlsSource';
import { ISource } from './ISource';
import { Subtitle } from '../video';
import { ISubtitleTrack } from '../subtitles/ISubtitleTrack';
import { requestFullscreen, exitFullscreen, getFullscreenElement } from '../../utils/fullscreen';
import { ChromeBottomComponent } from './chrome/BottomComponent';
import { parseSimpleQuery } from '../../utils/url';
import { IPlayerApi, PlaybackState, IVideoDetail } from './IPlayerApi';
import { ChromelessPlayerApi } from './ChromelessPlayerApi';
import { EventHandler } from '../../libs/events/EventHandler';
import { BrowserEvent } from '../../libs/events/BrowserEvent';
import { CuedThumbnailComponent } from './CuedThumbnailComponent';
import { ChromeTooltip, IChromeTooltip } from './chrome/Tooltip';
import { parseAndFormatTime } from '../../utils/time';
import { IRect } from '../../utils/rect';
import { BezelComponent } from './chrome/BezelComponent';

export interface IPlayerProps {
  config?: IPlayerConfig;
  large?: boolean;
  onSizeChange?: (large: boolean) => void;
}

export interface IPlayerConfig {
  title?: string;
  url?: string;
  thumbnailUrl?: string;
  subtitles?: Subtitle[];
  duration?: number;
  nextVideo?: IVideoDetail
}

const ICON_PLAY = "M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z";
const ICON_PAUSE = "M 12,26 16,26 16,10 12,10 z M 21,26 25,26 25,10 21,10 z";
const ICON_PREV = "m 12,12 h 2 v 12 h -2 z m 3.5,6 8.5,6 V 12 z";
const ICON_NEXT = "M 12,24 20.5,18 12,12 V 24 z M 22,12 v 12 h 2 V 12 h -2 z";
const ICON_VOLUME_MUTE = "m 21.48,17.98 c 0,-1.77 -1.02,-3.29 -2.5,-4.03 v 2.21 l 2.45,2.45 c .03,-0.2 .05,-0.41 .05,-0.63 z m 2.5,0 c 0,.94 -0.2,1.82 -0.54,2.64 l 1.51,1.51 c .66,-1.24 1.03,-2.65 1.03,-4.15 0,-4.28 -2.99,-7.86 -7,-8.76 v 2.05 c 2.89,.86 5,3.54 5,6.71 z M 9.25,8.98 l -1.27,1.26 4.72,4.73 H 7.98 v 6 H 11.98 l 5,5 v -6.73 l 4.25,4.25 c -0.67,.52 -1.42,.93 -2.25,1.18 v 2.06 c 1.38,-0.31 2.63,-0.95 3.69,-1.81 l 2.04,2.05 1.27,-1.27 -9,-9 -7.72,-7.72 z m 7.72,.99 -2.09,2.08 2.09,2.09 V 9.98 z";
const ICON_VOLUME = "M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.26 20.48,14.74 19,14 Z";
const ICON_VOLUME_HIGH = "M19,11.29 C21.89,12.15 24,14.83 24,18 C24,21.17 21.89,23.85 19,24.71 L19,26.77 C23.01,25.86 26,22.28 26,18 C26,13.72 23.01,10.14 19,9.23 L19,11.29 Z";

const ICON_SEEK_BACK_5 = "M 18,11 V 7 l -5,5 5,5 v -4 c 3.3,0 6,2.7 6,6 0,3.3 -2.7,6 -6,6 -3.3,0 -6,-2.7 -6,-6 h -2 c 0,4.4 3.6,8 8,8 4.4,0 8,-3.6 8,-8 0,-4.4 -3.6,-8 -8,-8 z m -1.3,8.9 .2,-2.2 h 2.4 v .7 h -1.7 l -0.1,.9 c 0,0 .1,0 .1,-0.1 0,-0.1 .1,0 .1,-0.1 0,-0.1 .1,0 .2,0 h .2 c .2,0 .4,0 .5,.1 .1,.1 .3,.2 .4,.3 .1,.1 .2,.3 .3,.5 .1,.2 .1,.4 .1,.6 0,.2 0,.4 -0.1,.5 -0.1,.1 -0.1,.3 -0.3,.5 -0.2,.2 -0.3,.2 -0.4,.3 C 18.5,22 18.2,22 18,22 17.8,22 17.6,22 17.5,21.9 17.4,21.8 17.2,21.8 17,21.7 16.8,21.6 16.8,21.5 16.7,21.3 16.6,21.1 16.6,21 16.6,20.8 h .8 c 0,.2 .1,.3 .2,.4 .1,.1 .2,.1 .4,.1 .1,0 .2,0 .3,-0.1 L 18.5,21 c 0,0 .1,-0.2 .1,-0.3 v -0.6 l -0.1,-0.2 -0.2,-0.2 c 0,0 -0.2,-0.1 -0.3,-0.1 h -0.2 c 0,0 -0.1,0 -0.2,.1 -0.1,.1 -0.1,0 -0.1,.1 0,.1 -0.1,.1 -0.1,.1 h -0.7 z";
const ICON_SEEK_FORWARD_5 = "m 10,19 c 0,4.4 3.6,8 8,8 4.4,0 8,-3.6 8,-8 h -2 c 0,3.3 -2.7,6 -6,6 -3.3,0 -6,-2.7 -6,-6 0,-3.3 2.7,-6 6,-6 v 4 l 5,-5 -5,-5 v 4 c -4.4,0 -8,3.6 -8,8 z m 6.7,.9 .2,-2.2 h 2.4 v .7 h -1.7 l -0.1,.9 c 0,0 .1,0 .1,-0.1 0,-0.1 .1,0 .1,-0.1 0,-0.1 .1,0 .2,0 h .2 c .2,0 .4,0 .5,.1 .1,.1 .3,.2 .4,.3 .1,.1 .2,.3 .3,.5 .1,.2 .1,.4 .1,.6 0,.2 0,.4 -0.1,.5 -0.1,.1 -0.1,.3 -0.3,.5 -0.2,.2 -0.3,.2 -0.5,.3 C 18.3,22 18.1,22 17.9,22 17.7,22 17.5,22 17.4,21.9 17.3,21.8 17.1,21.8 16.9,21.7 16.7,21.6 16.7,21.5 16.6,21.3 16.5,21.1 16.5,21 16.5,20.8 h .8 c 0,.2 .1,.3 .2,.4 .1,.1 .2,.1 .4,.1 .1,0 .2,0 .3,-0.1 L 18.4,21 c 0,0 .1,-0.2 .1,-0.3 v -0.6 l -0.1,-0.2 -0.2,-0.2 c 0,0 -0.2,-0.1 -0.3,-0.1 h -0.2 c 0,0 -0.1,0 -0.2,.1 -0.1,.1 -0.1,0 -0.1,.1 0,.1 -0.1,.1 -0.1,.1 h -0.6 z";
const ICON_SEEK_BACK_10 = "M 18,11 V 7 l -5,5 5,5 v -4 c 3.3,0 6,2.7 6,6 0,3.3 -2.7,6 -6,6 -3.3,0 -6,-2.7 -6,-6 h -2 c 0,4.4 3.6,8 8,8 4.4,0 8,-3.6 8,-8 0,-4.4 -3.6,-8 -8,-8 z M 16.9,22 H 16 V 18.7 L 15,19 v -0.7 l 1.8,-0.6 h .1 V 22 z m 4.3,-1.8 c 0,.3 0,.6 -0.1,.8 l -0.3,.6 c 0,0 -0.3,.3 -0.5,.3 -0.2,0 -0.4,.1 -0.6,.1 -0.2,0 -0.4,0 -0.6,-0.1 -0.2,-0.1 -0.3,-0.2 -0.5,-0.3 -0.2,-0.1 -0.2,-0.3 -0.3,-0.6 -0.1,-0.3 -0.1,-0.5 -0.1,-0.8 v -0.7 c 0,-0.3 0,-0.6 .1,-0.8 l .3,-0.6 c 0,0 .3,-0.3 .5,-0.3 .2,0 .4,-0.1 .6,-0.1 .2,0 .4,0 .6,.1 .2,.1 .3,.2 .5,.3 .2,.1 .2,.3 .3,.6 .1,.3 .1,.5 .1,.8 v .7 z m -0.9,-0.8 v -0.5 c 0,0 -0.1,-0.2 -0.1,-0.3 0,-0.1 -0.1,-0.1 -0.2,-0.2 -0.1,-0.1 -0.2,-0.1 -0.3,-0.1 -0.1,0 -0.2,0 -0.3,.1 l -0.2,.2 c 0,0 -0.1,.2 -0.1,.3 v 2 c 0,0 .1,.2 .1,.3 0,.1 .1,.1 .2,.2 .1,.1 .2,.1 .3,.1 .1,0 .2,0 .3,-0.1 l .2,-0.2 c 0,0 .1,-0.2 .1,-0.3 v -1.5 z";
const ICON_SEEK_FORWARD_10 = "m 10,19 c 0,4.4 3.6,8 8,8 4.4,0 8,-3.6 8,-8 h -2 c 0,3.3 -2.7,6 -6,6 -3.3,0 -6,-2.7 -6,-6 0,-3.3 2.7,-6 6,-6 v 4 l 5,-5 -5,-5 v 4 c -4.4,0 -8,3.6 -8,8 z m 6.8,3 H 16 V 18.7 L 15,19 v -0.7 l 1.8,-0.6 h .1 V 22 z m 4.3,-1.8 c 0,.3 0,.6 -0.1,.8 l -0.3,.6 c 0,0 -0.3,.3 -0.5,.3 C 20,21.9 19.8,22 19.6,22 19.4,22 19.2,22 19,21.9 18.8,21.8 18.7,21.7 18.5,21.6 18.3,21.5 18.3,21.3 18.2,21 18.1,20.7 18.1,20.5 18.1,20.2 v -0.7 c 0,-0.3 0,-0.6 .1,-0.8 l .3,-0.6 c 0,0 .3,-0.3 .5,-0.3 .2,0 .4,-0.1 .6,-0.1 .2,0 .4,0 .6,.1 .2,.1 .3,.2 .5,.3 .2,.1 .2,.3 .3,.6 .1,.3 .1,.5 .1,.8 v .7 z m -0.8,-0.8 v -0.5 c 0,0 -0.1,-0.2 -0.1,-0.3 0,-0.1 -0.1,-0.1 -0.2,-0.2 -0.1,-0.1 -0.2,-0.1 -0.3,-0.1 -0.1,0 -0.2,0 -0.3,.1 l -0.2,.2 c 0,0 -0.1,.2 -0.1,.3 v 2 c 0,0 .1,.2 .1,.3 0,.1 .1,.1 .2,.2 .1,.1 .2,.1 .3,.1 .1,0 .2,0 .3,-0.1 l .2,-0.2 c 0,0 .1,-0.2 .1,-0.3 v -1.5 z";

export class Player extends Component<IPlayerProps, {}> {
  private _config: IPlayerConfig|undefined = undefined;
  private _actionElement: HTMLElement;
  private _chromelessPlayer: ChromelessPlayer;
  private _cuedThumbnailComponent: CuedThumbnailComponent;
  private _bottomComponent: ChromeBottomComponent;
  private _tooltipComponent: ChromeTooltip;
  private _bezelElement: BezelComponent;
  private _api: IPlayerApi = new ChromelessPlayerApi();
  private _handler: EventHandler = new EventHandler(this);

  private _tooltipBottomRect: IRect;
  private _nextVideoButtonRect: IRect;
  private _sizeButtonRect: IRect;
  private _fullscreenButtonRect: IRect;

  private _autoHide: boolean = true;
  private _autoHideTimer: number;
  private _autoHideDelay: number = 200;
  private _autoHideMoveDelay: number = 3000;
  private _preview: boolean = false;

  private _actionClickTimer: number|undefined = undefined;
  private _actionClickExecuted: boolean = false;

  private _mouseDown: boolean = false;

  private _bigMode: boolean = false;

  constructor(props: IPlayerProps) {
    super(props);

    if (props.config) {
      this._config = props.config;
    }
    this._api.setLarge(!!props.large);
  }

  loadVideoByConfig(config: IPlayerConfig) {
    this._config = config;
    this._updateChromelessPlayer(config);
    if (config.thumbnailUrl && !config.url) {
      this._cuedThumbnailComponent.setThumbnailUrl(config.thumbnailUrl);
      this._cuedThumbnailComponent.setVisible(true);
    } else {
      this._cuedThumbnailComponent.setVisible(false);
    }
    this.setPreview(true);
    this.setAutoHide(true);
    this._api.setNextVideoDetail(config.nextVideo);
  }

  private async _updateChromelessPlayer(config: IPlayerConfig) {
    if (config.subtitles) {
      const tracks: ISubtitleTrack[] = [];
      let defaultTrack: number = 0;
      let selectedSubtitleId: number|undefined = undefined;
      let queries = parseSimpleQuery(location.search);

      for (let i = 0; i < config.subtitles.length; i++) {
        let useSubtitle = false;
        if (queries.hasOwnProperty('ssid')) {
          let id: string = queries['ssid'];
          useSubtitle = config.subtitles[i].id === id;
        } else {
          useSubtitle = config.subtitles[i].isDefault;
        }
        if (useSubtitle) {
          defaultTrack = i;
        }
        
        let subtitle = config.subtitles[i];
        tracks.push({
          label: subtitle.title,
          getContent: async (): Promise<string> => {
            return (await subtitle.getContent()).toAss();
          }
        });
      }
      this._chromelessPlayer.setSubtitleTracks(tracks);
      this._chromelessPlayer.setSubtitleTrack(defaultTrack);
    }

    if (config.url) {
      this._chromelessPlayer.setVideoSource(new HlsSource(config.url));
    }
    if (typeof config.duration === 'number') {
      this._chromelessPlayer.setDuration(config.duration);
    } else {
      this._chromelessPlayer.setDuration(NaN);
    }
  }

  setPreview(preview: boolean): void {
    this._preview = preview;

    if (preview) {
      this.base.classList.add('html5-video-player--preview');
    } else {
      this.base.classList.remove('html5-video-player--preview');
    }

    this.updateInternalAutoHide();
  }

  isPreview(): boolean {
    return this._preview;
  }

  setAutoHide(hide: boolean): void {
    this._autoHide = hide;
    this.updateInternalAutoHide();
  }

  updateInternalAutoHide(): void {
    let hide = this._autoHide;

    if (this._mouseDown) {
      hide = false;
    }

    const state = this._api.getPlaybackState();
    if (state !== PlaybackState.PLAYING) {
      hide = false;
    }
    if (this._preview) {
      hide = true;
    }

    if (hide) {
      this.base.classList.add('html5-video-player--autohide');
      this._bottomComponent.setInternalVisibility(false);
    } else {
      this.base.classList.remove('html5-video-player--autohide');
      this._bottomComponent.setInternalVisibility(true);
    }
  }

  getApi(): IPlayerApi {
    return this._api;
  }

  private _onSizeChange(): void {
    const large = this._api.isLarge();
    if (large) {
      this.base.classList.add("html5-video-player--large");
    } else {
      this.base.classList.remove("html5-video-player--large");
    }

    if (this.props.onSizeChange) {
      this.props.onSizeChange(large);
    }

    this._tooltipComponent.base.style.display = "none";

    this.resize();
  }

  private _onMouseMouse(e: BrowserEvent) {
    window.clearTimeout(this._autoHideTimer);
    this.setAutoHide(false);

    const el = this._bottomComponent.base;

    if (e.target !== el && !el.contains(e.target as Node)) {
      this._autoHideTimer = window.setTimeout(
        () => this.setAutoHide(true),
        this._autoHideMoveDelay
      );
    }
  }

  private _onMouseLeave(e: BrowserEvent) {
    window.clearTimeout(this._autoHideTimer);
    this._autoHideTimer = window.setTimeout(
      () => this.setAutoHide(true),
      this._autoHideDelay
    );
  }

  private _playSvgBezel(d: string): void {
    this._bezelElement.playSvgPath(d);
  }

  private _onKeyDown(e: BrowserEvent) {
    const api = this.getApi();
    switch (e.keyCode) {
      case 49:
        api.seekTo(api.getDuration()*0.1);
        break;
      case 50:
        api.seekTo(api.getDuration()*0.2);
        break;
      case 51:
        api.seekTo(api.getDuration()*0.3);
        break;
      case 52:
        api.seekTo(api.getDuration()*0.4);
        break;
      case 53:
        api.seekTo(api.getDuration()*0.5);
        break;
      case 54:
        api.seekTo(api.getDuration()*0.6);
        break;
      case 55:
        api.seekTo(api.getDuration()*0.7);
        break;
      case 56:
        api.seekTo(api.getDuration()*0.8);
        break;
      case 57:
        api.seekTo(api.getDuration()*0.9);
        break;
      // Space
      // K
      case 32:
      case 75:
        var playing = api.getPreferredPlaybackState() === PlaybackState.PLAYING;
        if (playing) {
          this._playSvgBezel(ICON_PAUSE);
          api.pauseVideo();
        } else {
          this._playSvgBezel(ICON_PLAY);
          api.playVideo();
        }
        break;
      // End
      case 35:
        api.seekTo(api.getDuration());
        break;
      // Home
      // 0
      case 36:
      case 48:
        api.seekTo(0);
        break;
      // Left arrow
      case 37:
        this._playSvgBezel(ICON_SEEK_BACK_5);
        api.seekTo(Math.max(api.getCurrentTime() - 5, 0));
        break;
      // Up arrow
      case 38:
        this._playSvgBezel(ICON_VOLUME + " " + ICON_VOLUME_HIGH);
        api.setVolume(Math.min(api.getVolume() + 5/100, 1));
        break;
      // Right arrow
      case 39:
        this._playSvgBezel(ICON_SEEK_FORWARD_5);
        api.seekTo(Math.min(api.getCurrentTime() + 5, api.getDuration()));
        break;
      // Down arrow
      case 40:
        this._playSvgBezel(ICON_VOLUME);
        api.setVolume(Math.max(api.getVolume() - 5/100, 0));
        break;
      // F
      case 70:
        api.toggleFullscreen();
        break;
      // J
      case 74:
        this._playSvgBezel(ICON_SEEK_BACK_10);
        api.seekTo(Math.max(api.getCurrentTime() - 10, 0));
        break;
      // L
      case 76:
        this._playSvgBezel(ICON_SEEK_FORWARD_10);
        api.seekTo(Math.min(api.getCurrentTime() + 10, api.getDuration()));
        break;
      // M
      case 77:
        if (api.isMuted()) {
          this._playSvgBezel(ICON_VOLUME_MUTE);
          api.mute();
        } else {
          this._playSvgBezel(ICON_VOLUME + " " + ICON_VOLUME_HIGH);
          api.unmute();
        }
        break;
      // ,
      case 188:
        break;
      // .
      case 190:
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  private _onPlaybackStateChange() {
    const state = this._api.getPlaybackState();
    if (state === PlaybackState.PLAYING) {
      this.setAutoHide(this._autoHide);
    } else {
      this.updateInternalAutoHide();
    }
  }

  isBigMode(): boolean {
    return this._bigMode;
  }

  setBigMode(bigMode: boolean): void {
    this._bigMode = bigMode;
    if (this._bigMode) {
      this.base.classList.add("chrome-big-mode");
    } else {
      this.base.classList.remove("chrome-big-mode");
    }
  }

  private _onFullscreenChange() {
    const fullscreen = this._api.isFullscreen();
    this.setBigMode(fullscreen);
    if (fullscreen) {
      this.base.classList.add("html5-video-player--fullscreen");
    } else {
      this.base.classList.remove("html5-video-player--fullscreen");
    }
    this._tooltipComponent.base.style.display = "none";

    this.resize();
  }

  private _setTooltip(tooltip: IChromeTooltip, left: number) {
    if (this.isPreview()) {
      this._tooltipComponent.base.style.display = "none";
      return;
    }
    this._tooltipComponent.setTooltip(tooltip);
    this._tooltipComponent.setPosition(0, 0);

    const rect = this._tooltipBottomRect;
    const size = this._tooltipComponent.getSize();

    left = left - size.width/2;
    left = Math.min(Math.max(left, rect.left), rect.left + rect.width - size.width);

    this._tooltipComponent.setPosition(left, rect.top - size.height);
  }

  private _onProgressHover(time: number, percentage: number) {
    this.base.classList.add('chrome-progress-bar-hover');

    const rect = this._tooltipBottomRect;
    this._setTooltip({
      text: parseAndFormatTime(time)
    }, rect.width*percentage + rect.left);
  }

  private _onProgressEndHover() {
    this.base.classList.remove('chrome-progress-bar-hover');
    this._tooltipComponent.base.style.display = "none";
  }
  
  private _onNextVideoHover(detail: IVideoDetail) {
    const bigMode = this.isBigMode();
    const tooltip: IChromeTooltip = {
      textDetail: true,
      preview: true,
      title: 'Next',
      text: detail.title,
      backgroundImage: {
        width: bigMode ? 240 : 160,
        height: bigMode ? 135 : 90,
        src: detail.thumbnailUrl
      }
    };
    if (typeof detail.duration === 'number' && isFinite(detail.duration)) {
      tooltip.duration = parseAndFormatTime(detail.duration);
    }
    const btnRect = this._nextVideoButtonRect;
    this._setTooltip(tooltip, btnRect.left + btnRect.width/2);
  }
  
  private _onNextVideoEndHover() {
    this._tooltipComponent.base.style.display = "none";
  }
  
  private _onSizeButtonHover() {
    const btnRect = this._sizeButtonRect;
    this._setTooltip({
      text: this._api.isLarge() ? 'Small' : 'Large'
    }, btnRect.left + btnRect.width/2);
  }
  
  private _onSizeButtonEndHover() {
    this._tooltipComponent.base.style.display = "none";
  }
  
  private _onFullscreenButtonHover() {
    const btnRect = this._fullscreenButtonRect;
    this._setTooltip({
      text: this._api.isFullscreen() ? 'Exit full screen' : 'Full screen'
    }, btnRect.left + btnRect.width/2);
  }
  
  private _onFullscreenButtonEndHover() {
    this._tooltipComponent.base.style.display = "none";
  }

  private _onActionMouseDown(e: BrowserEvent) {
    e.preventDefault();
  }
  
  private _onActionClick(e: BrowserEvent) {
    if (typeof this._actionClickTimer === "number") {
      window.clearTimeout(this._actionClickTimer);
      this._actionClickTimer = undefined;

      return;
    }

    const api = this._api;
    const playing = api.getPreferredPlaybackState() === PlaybackState.PLAYING;

    if (playing) {
      this._playSvgBezel(ICON_PAUSE);
    } else {
      this._playSvgBezel(ICON_PLAY);
    }

    this._actionClickExecuted = false;
    this._actionClickTimer = window.setTimeout(() => {
      this._actionClickTimer = undefined;
      this._actionClickExecuted = true;

      const playing = api.getPreferredPlaybackState() === PlaybackState.PLAYING;
      if (playing) {
        api.pauseVideo();
      } else {
        api.playVideo();
      }
    }, 200);
  }
  
  private _onActionDoubleClick(e: BrowserEvent) {
    this._bezelElement.stop();
    const api = this._api;
    if (this._actionClickExecuted) {
      this._actionClickExecuted = false;
      
      const playing = api.getPreferredPlaybackState() === PlaybackState.PLAYING;
      if (playing) {
        api.pauseVideo();
      } else {
        api.playVideo();
      }
    }

    api.toggleFullscreen();
  }
  
  private _onMouseDown() {
    this._mouseDown = true;
  }
  
  private _onMouseUp() {
    this._mouseDown = false;

    this.updateInternalAutoHide();
  }

  private _onLoadedMetadata() {
    this.setPreview(false);
  }

  resize() {
    this._chromelessPlayer.resize();

    const rect = this.base.getBoundingClientRect();

    const bottomRect = this._bottomComponent.base
      .querySelector(".chrome-progress-bar-padding")!.getBoundingClientRect();
    const nextVideoRect = this._bottomComponent.base
      .querySelector(".chrome-next-button")!.getBoundingClientRect();
    const sizeButtonRect = this._bottomComponent.base
      .querySelector(".chrome-size-button")!.getBoundingClientRect();
    const fullscreenButtonRect = this._bottomComponent.base
      .querySelector(".chrome-fullscreen-button")!.getBoundingClientRect();

    this._tooltipBottomRect = {
      width: bottomRect.width,
      height: bottomRect.height,
      left: bottomRect.left - rect.left,
      top: bottomRect.top - rect.top
    };
    this._nextVideoButtonRect = {
      width: nextVideoRect.width,
      height: nextVideoRect.height,
      left: nextVideoRect.left - rect.left,
      top: nextVideoRect.top - rect.top
    };
    this._sizeButtonRect = {
      width: sizeButtonRect.width,
      height: sizeButtonRect.height,
      left: sizeButtonRect.left - rect.left,
      top: sizeButtonRect.top - rect.top
    };
    this._fullscreenButtonRect = {
      width: fullscreenButtonRect.width,
      height: fullscreenButtonRect.height,
      left: fullscreenButtonRect.left - rect.left,
      top: fullscreenButtonRect.top - rect.top
    };
  }

  componentDidMount() {
    if (this._chromelessPlayer) {
      this._chromelessPlayer.setFullscreenElement(this.base);
    }

    if (this._config) {
      this.loadVideoByConfig(this._config);
    }

    this.resize();

    this._handler
      .listen(this.base, 'mousedown', this._onMouseDown, false)
      .listen(document, 'mouseup', this._onMouseUp, false)
      .listen(this.base, 'mouseenter', this._onMouseMouse, false)
      .listen(this.base, 'mousemove', this._onMouseMouse, false)
      .listen(this.base, 'mouseleave', this._onMouseLeave, false)
      .listen(this.base, 'keydown', this._onKeyDown, false)
      .listen(this._actionElement, 'mousedown', this._onActionMouseDown, false)
      .listen(this._actionElement, 'click', this._onActionClick, false)
      .listen(this._actionElement, 'dblclick', this._onActionDoubleClick, false)
      .listen(this._api, 'playbackstatechange', this._onPlaybackStateChange, false)
      .listen(this._api, 'fullscreenchange', this._onFullscreenChange, false)
      .listen(this._api, 'sizechange', this._onSizeChange, false)
      .listen(this._api, 'loadedmetadata', this._onLoadedMetadata, false)
      .listen(window, "resize", this.resize, { 'passive': true });
  }

  componentWillUnmount() {
    this._handler.removeAll();
  }

  render(): JSX.Element {
    const chromelessRef = (el: ChromelessPlayer) => {
      this._chromelessPlayer = el;
      if (this.base) {
        this._chromelessPlayer.setFullscreenElement(this.base);
      }
    };
    const bottomRef = (el: ChromeBottomComponent) => this._bottomComponent = el;
    const cuedThumbnailRef = (el: CuedThumbnailComponent) => this._cuedThumbnailComponent = el;
    const tooltipRef = (el: ChromeTooltip) => this._tooltipComponent = el;
    const actionRef = (el: HTMLElement) => this._actionElement = el;
    const bezelRef = (el: BezelComponent) => this._bezelElement = el;

    const onProgressHover = (time: number, percentage: number) => this._onProgressHover(time, percentage);
    const onProgressEndHover = () => this._onProgressEndHover();
    const onNextVideoHover = (detail: IVideoDetail) => this._onNextVideoHover(detail);
    const onNextVideoEndHover = () => this._onNextVideoEndHover();
    const onSizeButtonHover = () => this._onSizeButtonHover();
    const onSizeButtonEndHover = () => this._onSizeButtonEndHover();
    const onFullscreenButtonHover = () => this._onFullscreenButtonHover();
    const onFullscreenButtonEndHover = () => this._onFullscreenButtonEndHover();

    const attributes = {
      'tabindex': '0'
    };

    const className = "html5-video-player"
      + (this._api.isLarge() ? " html5-video-player--large" : "");
    return (
      <div class={className} {...attributes}>
        <ChromelessPlayer ref={chromelessRef} api={this.getApi() as ChromelessPlayerApi}></ChromelessPlayer>
        <CuedThumbnailComponent ref={cuedThumbnailRef}></CuedThumbnailComponent>
        <BezelComponent ref={bezelRef}></BezelComponent>
        <div
          ref={actionRef}
          class="html5-video-action"></div>
        <ChromeTooltip ref={tooltipRef}></ChromeTooltip>
        <div class="html5-video-gradient-bottom"></div>
        <ChromeBottomComponent
          ref={bottomRef}
          api={this.getApi()}
          onProgressHover={onProgressHover}
          onProgressEndHover={onProgressEndHover}
          onNextVideoHover={onNextVideoHover}
          onNextVideoEndHover={onNextVideoEndHover}
          onSizeButtonHover={onSizeButtonHover}
          onSizeButtonEndHover={onSizeButtonEndHover}
          onFullscreenButtonHover={onFullscreenButtonHover}
          onFullscreenButtonEndHover={onFullscreenButtonEndHover}></ChromeBottomComponent>
      </div>
    );
  }
}
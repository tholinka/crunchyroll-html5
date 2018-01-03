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
import { ICON_PAUSE, ICON_PLAY, ICON_SEEK_BACK_5, ICON_VOLUME, ICON_VOLUME_HIGH, ICON_SEEK_FORWARD_5, ICON_SEEK_BACK_10, ICON_SEEK_FORWARD_10, ICON_VOLUME_MUTE } from './assets';
import { BufferComponent } from './chrome/BufferComponent';

export interface IPlayerProps {
  config?: IPlayerConfig;
  large?: boolean;
  sizeEnabled?: boolean;
  onSizeChange?: (large: boolean) => void;
}

export interface IPlayerConfig {
  title?: string;
  url?: string;
  thumbnailUrl?: string;
  subtitles?: Subtitle[];
  duration?: number;
  nextVideo?: IVideoDetail;
  startTime?: number;
  autoplay?: boolean;
}

export class Player extends Component<IPlayerProps, {}> {
  private _configCued: boolean = false;
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
  private _volumeMuteButtonRect: IRect;

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

  cueVideoByConfig(config: IPlayerConfig) {
    this._config = config;
    this._configCued = true;
    if (config.thumbnailUrl) {
      this._cuedThumbnailComponent.setThumbnailUrl(config.thumbnailUrl);
    } else {
      this._cuedThumbnailComponent.setThumbnailUrl('');
    }
    this._cuedThumbnailComponent.setButtonVisible(true);
    this.setPreview(true);
    this.setAutoHide(true);

    this.resize();
  }

  loadVideoByConfig(config: IPlayerConfig) {
    this._config = config;
    this._updateChromelessPlayer(config);
    if (config.thumbnailUrl && !config.url) {
      this._cuedThumbnailComponent.setThumbnailUrl(config.thumbnailUrl);
      this.setPreview(true);
    } else {
      this._cuedThumbnailComponent.setThumbnailUrl('');
      this.setPreview(false);
    }
    this._cuedThumbnailComponent.setButtonVisible(false);
    this.setAutoHide(true);
    this._api.setNextVideoDetail(config.nextVideo);

    this.resize();
  }

  private async _updateChromelessPlayer(config: IPlayerConfig) {
    this._configCued = false;
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
      this._chromelessPlayer.setVideoSource(new HlsSource(config.url), config.startTime);
    } else {
      this._chromelessPlayer.removeVideoSource();
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
      this._cuedThumbnailComponent.setVisible(!!this._cuedThumbnailComponent.getThumbnailUrl());
    } else {
      this.base.classList.remove('html5-video-player--preview');
      this._cuedThumbnailComponent.setVisible(false);
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

    const unstarted = this.base.classList.contains('unstarted-mode');

    this.base.classList.remove("playing-mode", "ended-mode", "unstarted-mode");
    switch (state) {
      case PlaybackState.PLAYING:
        this.base.classList.add("playing-mode");
        break;
      case PlaybackState.PAUSED:
        this.base.classList.add("paused-mode");
        break;
      case PlaybackState.UNSTARTED:
        this.base.classList.add("unstarted-mode");
        break;
    }

    if (unstarted) {
      this.resize();
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

    this.resize();
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
  
  private _onVolumeMuteButtonHover() {
    const btnRect = this._volumeMuteButtonRect;
    this._setTooltip({
      text: (this._api.isMuted() || this._api.getVolume() === 0) ? 'Unmute' : 'Mute'
    }, btnRect.left + btnRect.width/2);
  }
  
  private _onVolumeMuteButtonEndHover() {
    this._tooltipComponent.base.style.display = "none";
  }

  private _onActionMouseDown(e: BrowserEvent) {
    e.preventDefault();
  }
  
  private _onActionClick(e: BrowserEvent) {
    this.base.focus();
    
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
    const volumeMuteButtonRect = this._bottomComponent.base
      .querySelector(".chrome-mute-button")!.getBoundingClientRect();

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
    this._volumeMuteButtonRect = {
      width: volumeMuteButtonRect.width,
      height: volumeMuteButtonRect.height,
      left: volumeMuteButtonRect.left - rect.left,
      top: volumeMuteButtonRect.top - rect.top
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
    const onVolumeMuteButtonHover = () => this._onVolumeMuteButtonHover();
    const onVolumeMuteButtonEndHover = () => this._onVolumeMuteButtonEndHover();
    const onCuedThumbnailClick = () => {
      if (this._config && this._configCued) {
        this._updateChromelessPlayer(this._config);

        this._cuedThumbnailComponent.setVisible(false);

        this.setPreview(false);
        this.setAutoHide(true);

        this.resize();
      }
    };

    const attributes = {
      'tabindex': '0'
    };

    let autoplay = true;
    if (this.props.config && typeof this.props.config.autoplay === 'boolean') {
      autoplay = this.props.config.autoplay;
    }

    const className = "html5-video-player unstarted-mode"
      + (this._api.isLarge() ? " html5-video-player--large" : "");
    return (
      <div class={className} {...attributes}>
        <ChromelessPlayer
          ref={chromelessRef}
          api={this.getApi() as ChromelessPlayerApi}></ChromelessPlayer>
        <CuedThumbnailComponent
          ref={cuedThumbnailRef}
          onClick={onCuedThumbnailClick}></CuedThumbnailComponent>
        <BufferComponent api={this.getApi()}></BufferComponent>
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
          sizeButtonVisible={this.props.sizeEnabled}
          onSizeButtonHover={onSizeButtonHover}
          onSizeButtonEndHover={onSizeButtonEndHover}
          onFullscreenButtonHover={onFullscreenButtonHover}
          onFullscreenButtonEndHover={onFullscreenButtonEndHover}
          onVolumeMuteButtonHover={onVolumeMuteButtonHover}
          onVolumeMuteButtonEndHover={onVolumeMuteButtonEndHover}></ChromeBottomComponent>
      </div>
    );
  }
}
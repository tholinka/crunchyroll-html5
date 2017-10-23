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

export class Player extends Component<IPlayerProps, {}> {
  private _config: IPlayerConfig|undefined = undefined;
  private _chromelessPlayer: ChromelessPlayer;
  private _cuedThumbnailComponent: CuedThumbnailComponent;
  private _bottomComponent: ChromeBottomComponent;
  private _tooltipComponent: ChromeTooltip;
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
      this.setAutoHide(true, true);
    } else {
      this._cuedThumbnailComponent.setVisible(false);
      this.setAutoHide(true);
    }
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

  setAutoHide(hide: boolean, force: boolean = false): void {
    if (!force) {
      this._autoHide = hide;

      const state = this._api.getPlaybackState();
      if (state !== PlaybackState.PLAYING) {
        hide = false;
      }
      if (this._config && this._config.thumbnailUrl && !this._config.url) {
        hide = true;
      }
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

  private _onPlaybackStateChange() {
    const state = this._api.getPlaybackState();
    if (state === PlaybackState.PLAYING) {
      this.setAutoHide(this._autoHide);
    } else {
      this.setAutoHide(false, true);
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
    }, rect.width*percentage - rect.left);
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
      .listen(this.base, 'mouseenter', this._onMouseMouse, false)
      .listen(this.base, 'mousemove', this._onMouseMouse, false)
      .listen(this.base, 'mouseleave', this._onMouseLeave, false)
      .listen(this._api, 'playbackstatechange', this._onPlaybackStateChange, false)
      .listen(this._api, 'fullscreenchange', this._onFullscreenChange, false)
      .listen(this._api, 'sizechange', this._onSizeChange, false)
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

    const onProgressHover = (time: number, percentage: number) => this._onProgressHover(time, percentage);
    const onProgressEndHover = () => this._onProgressEndHover();
    const onNextVideoHover = (detail: IVideoDetail) => this._onNextVideoHover(detail);
    const onNextVideoEndHover = () => this._onNextVideoEndHover();
    const onSizeButtonHover = () => this._onSizeButtonHover();
    const onSizeButtonEndHover = () => this._onSizeButtonEndHover();
    const onFullscreenButtonHover = () => this._onFullscreenButtonHover();
    const onFullscreenButtonEndHover = () => this._onFullscreenButtonEndHover();

    const className = "html5-video-player"
      + (this._api.isLarge() ? " html5-video-player--large" : "");
    return (
      <div class={className}>
        <ChromelessPlayer ref={chromelessRef} api={this.getApi() as ChromelessPlayerApi}></ChromelessPlayer>
        <CuedThumbnailComponent ref={cuedThumbnailRef}></CuedThumbnailComponent>
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
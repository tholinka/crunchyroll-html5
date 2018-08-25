import { ISubtitle } from 'crunchyroll-lib/models/ISubtitle';
import { Component, h } from 'preact';
import { SubtitleToAss } from '../../converter/SubtitleToAss';
import { IAction } from '../../libs/actions/IAction';
import { IActionable } from '../../libs/actions/IActionable';
import { BrowserEvent } from '../../libs/events/BrowserEvent';
import { EventHandler } from '../../libs/events/EventHandler';
import { IRect } from '../../utils/rect';
import { parseAndFormatTime } from '../../utils/time';
import { parseSimpleQuery } from '../../utils/url';
import { ISubtitleTrack } from '../subtitles/ISubtitleTrack';
import {
  ICON_PAUSE,
  ICON_PLAY,
  ICON_SEEK_BACK_10,
  ICON_SEEK_BACK_5,
  ICON_SEEK_FORWARD,
  ICON_SEEK_FORWARD_10,
  ICON_SEEK_FORWARD_5,
  ICON_VOLUME,
  ICON_VOLUME_HIGH,
  ICON_VOLUME_MUTE
} from './assets';
import { BezelComponent } from './chrome/BezelComponent';
import { ChromeBottomComponent } from './chrome/BottomComponent';
import { BufferComponent } from './chrome/BufferComponent';
import { ChromeSettingsPopup } from './chrome/SettingsPopup';
import { ChromeTooltip, IChromeTooltip } from './chrome/Tooltip';
import { ChromelessPlayer } from './ChromelessPlayer';
import { ChromelessPlayerApi } from './ChromelessPlayerApi';
import { CuedThumbnailComponent } from './CuedThumbnailComponent';
import { HlsSource } from './HlsSource';
import { IPlayerApi, IVideoDetail, PlaybackState } from './IPlayerApi';
import { PlayerAction } from './PlayerAction';

export interface IPlayerProps {
  config?: IPlayerConfig;
  large?: boolean;
  sizeEnabled?: boolean;
  onSizeChange?: (large: boolean) => void;
}

export interface IPlayerState {
  maxPopupHeight: number;
}

export interface IPlayerConfig {
  title?: string;
  url?: string;
  thumbnailUrl?: string;
  subtitles?: ISubtitle[];
  duration?: number;
  nextVideo?: IVideoDetail;
  startTime?: number;
  autoplay?: boolean;
  volume?: number;
  muted?: boolean;
}

export class Player extends Component<IPlayerProps, IPlayerState>
  implements IActionable {
  private _configCued: boolean = false;
  private _config: IPlayerConfig | undefined = undefined;
  private _actionElement?: Element;
  private _chromelessPlayer?: ChromelessPlayer;
  private _cuedThumbnailComponent?: CuedThumbnailComponent;
  private _bottomComponent?: ChromeBottomComponent;
  private _tooltipComponent?: ChromeTooltip;
  private _bezelElement?: BezelComponent;
  private _api: IPlayerApi = new ChromelessPlayerApi();
  private _handler: EventHandler = new EventHandler(this);

  private _tooltipBottomRect?: IRect;
  private _nextVideoButtonRect?: IRect;
  private _sizeButtonRect?: IRect;
  private _fullscreenButtonRect?: IRect;
  private _volumeMuteButtonRect?: IRect;
  private _settingsButtonRect?: IRect;

  private _autoHide: boolean = true;
  private _autoHideTimer?: number;
  private _autoHideDelay: number = 200;
  private _autoHideMoveDelay: number = 3000;
  private _preview: boolean = false;
  private _forceHide: boolean = false;

  private _actionClickTimer: number | undefined = undefined;
  private _actionClickExecuted: boolean = false;

  private _mouseDown: boolean = false;

  private _bigMode: boolean = false;

  private _actions?: IAction[];

  constructor(props: IPlayerProps) {
    super(props);

    if (props.config) {
      this._config = props.config;
    }
    this._api.setLarge(!!props.large);
    this.state = {
      maxPopupHeight: 0
    };
  }

  public getActions(): IAction[] {
    if (!this._actions) {
      const api = this.getApi();
      this._actions = [
        new PlayerAction('seek_forward_85s', () => {
          this._playSvgBezel(ICON_SEEK_FORWARD);
          api.seekTo(Math.min(api.getCurrentTime() + 85, api.getDuration()));
        }),
        new PlayerAction('seek_start', () => api.seekTo(0)),
        new PlayerAction('seek_10%', () => api.seekTo(api.getDuration() * 0.1)),
        new PlayerAction('seek_20%', () => api.seekTo(api.getDuration() * 0.2)),
        new PlayerAction('seek_30%', () => api.seekTo(api.getDuration() * 0.3)),
        new PlayerAction('seek_40%', () => api.seekTo(api.getDuration() * 0.4)),
        new PlayerAction('seek_50%', () => api.seekTo(api.getDuration() * 0.5)),
        new PlayerAction('seek_60%', () => api.seekTo(api.getDuration() * 0.6)),
        new PlayerAction('seek_70%', () => api.seekTo(api.getDuration() * 0.7)),
        new PlayerAction('seek_80%', () => api.seekTo(api.getDuration() * 0.8)),
        new PlayerAction('seek_90%', () => api.seekTo(api.getDuration() * 0.9)),
        new PlayerAction('seek_end', () => api.seekTo(api.getDuration())),
        new PlayerAction('seek_forward_5s', () => {
          this._playSvgBezel(ICON_SEEK_FORWARD_5);
          api.seekTo(Math.min(api.getCurrentTime() + 5, api.getDuration()));
        }),
        new PlayerAction('seek_forward_10s', () => {
          this._playSvgBezel(ICON_SEEK_FORWARD_10);
          api.seekTo(Math.min(api.getCurrentTime() + 10, api.getDuration()));
        }),
        new PlayerAction('seek_backward_5s', () => {
          this._playSvgBezel(ICON_SEEK_BACK_5);
          api.seekTo(Math.max(api.getCurrentTime() - 5, 0));
        }),
        new PlayerAction('seek_backward_10s', () => {
          this._playSvgBezel(ICON_SEEK_BACK_10);
          api.seekTo(Math.max(api.getCurrentTime() - 10, 0));
        }),
        new PlayerAction('volume_up', () => {
          this._playSvgBezel(ICON_VOLUME + ' ' + ICON_VOLUME_HIGH);
          api.setVolume(Math.min(api.getVolume() + 5 / 100, 1));
        }),
        new PlayerAction('volume_down', () => {
          this._playSvgBezel(ICON_VOLUME);
          api.setVolume(Math.max(api.getVolume() - 5 / 100, 0));
        }),
        new PlayerAction('toggle_fullscreen', () => api.toggleFullscreen()),
        new PlayerAction('mute_unmute', () => {
          if (!api.isMuted()) {
            this._playSvgBezel(ICON_VOLUME_MUTE);
            api.mute();
          } else {
            this._playSvgBezel(ICON_VOLUME + ' ' + ICON_VOLUME_HIGH);
            api.unmute();
          }
        }),
        new PlayerAction('next_video', () => api.playNextVideo()),
        new PlayerAction('play_pause', () => {
          const playing =
            api.getPreferredPlaybackState() === PlaybackState.PLAYING;
          if (playing) {
            this._playSvgBezel(ICON_PAUSE);
            api.pauseVideo();
          } else {
            this._playSvgBezel(ICON_PLAY);
            api.playVideo();
          }
        }),
        new PlayerAction('toggle_hide', () =>
          this.setForceHide(!this.isForceHide())
        )
      ];
    }
    return this._actions;
  }

  public cueVideoByConfig(config: IPlayerConfig) {
    if (!this._cuedThumbnailComponent)
      throw new Error('CuedThumbnailComponent is undefined');

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

  public loadVideoByConfig(config: IPlayerConfig) {
    if (!this._cuedThumbnailComponent)
      throw new Error('CuedThumbnailComponent is undefined');

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

  public setPreview(preview: boolean): void {
    if (!this._cuedThumbnailComponent)
      throw new Error('CuedThumbnailComponent is undefined');

    this._preview = preview;

    if (preview) {
      this.base.classList.add('html5-video-player--preview');
      this._cuedThumbnailComponent.setVisible(
        !!this._cuedThumbnailComponent.getThumbnailUrl()
      );
    } else {
      this.base.classList.remove('html5-video-player--preview');
      this._cuedThumbnailComponent.setVisible(false);
    }

    this.updateInternalAutoHide();
  }

  public isPreview(): boolean {
    return this._preview;
  }

  public setAutoHide(hide: boolean): void {
    this._autoHide = hide;
    this.updateInternalAutoHide();
  }

  public setForceHide(hide: boolean): void {
    this._forceHide = hide;
    this.updateInternalAutoHide();
  }

  public isForceHide(): boolean {
    return this._forceHide;
  }

  public updateInternalAutoHide(): void {
    if (!this._bottomComponent) throw new Error('BottomComponent is undefined');

    let hide = this._autoHide;

    if (this._mouseDown) {
      hide = false;
    }

    const state = this._api.getPlaybackState();
    if (state !== PlaybackState.PLAYING) {
      hide = false;
    }

    if (this._api.isSettingsOpen()) {
      hide = false;
    }

    const forceHide = this.isForceHide();
    let requireResizeCalculations = false;

    if (forceHide) {
      this.base.classList.add('html5-video-player--autohide--force');
    } else {
      requireResizeCalculations = this.base.classList.contains(
        'html5-video-player--autohide--force'
      );
      this.base.classList.remove('html5-video-player--autohide--force');
    }

    if (hide || this._preview || forceHide) {
      this.base.classList.add('html5-video-player--autohide');
      this._bottomComponent.setInternalVisibility(false);

      if (!this._preview && hide) {
        this.base.classList.add('html5-video-player--autohide--hide-cursor');
      } else {
        this.base.classList.remove('html5-video-player--autohide--hide-cursor');
      }
    } else {
      this.base.classList.remove('html5-video-player--autohide');
      this._bottomComponent.setInternalVisibility(true);
    }

    if (requireResizeCalculations) {
      this.resize();
    }
  }

  public getApi(): IPlayerApi {
    return this._api;
  }

  public isBigMode(): boolean {
    return this._bigMode;
  }

  public setBigMode(bigMode: boolean): void {
    this._bigMode = bigMode;
    if (this._bigMode) {
      this.base.classList.add('chrome-big-mode');
    } else {
      this.base.classList.remove('chrome-big-mode');
    }

    this.resize();
  }

  public resize() {
    if (!this._chromelessPlayer)
      throw new Error('ChromelessPlayer is undefined');
    if (!this._bottomComponent) throw new Error('BottomComponent is undefined');

    this._chromelessPlayer.resize();

    const rect = this.base.getBoundingClientRect();

    this.setState({
      maxPopupHeight:
        rect.height - 49 /* from css: .html5-video-gradient-bottom */ - 12
    });

    const bottomRect = this._bottomComponent.base
      .querySelector('.chrome-progress-bar-padding')!
      .getBoundingClientRect();
    const nextVideoRect = this._bottomComponent.base
      .querySelector('.chrome-next-button')!
      .getBoundingClientRect();
    const sizeButtonRect = this._bottomComponent.base
      .querySelector('.chrome-size-button')!
      .getBoundingClientRect();
    const fullscreenButtonRect = this._bottomComponent.base
      .querySelector('.chrome-fullscreen-button')!
      .getBoundingClientRect();
    const volumeMuteButtonRect = this._bottomComponent.base
      .querySelector('.chrome-mute-button')!
      .getBoundingClientRect();
    const settingsMuteButtonRect = this._bottomComponent.base
      .querySelector('.chrome-settings-button')!
      .getBoundingClientRect();

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
    this._settingsButtonRect = {
      width: settingsMuteButtonRect.width,
      height: settingsMuteButtonRect.height,
      left: settingsMuteButtonRect.left - rect.left,
      top: settingsMuteButtonRect.top - rect.top
    };
  }

  public componentDidMount() {
    if (!this._actionElement) throw new Error('ActionElement is undefined');

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
      .listen(this._actionElement, 'mousedown', this._onActionMouseDown, false)
      .listen(this._actionElement, 'click', this._onActionClick, false)
      .listen(this._actionElement, 'dblclick', this._onActionDoubleClick, false)
      .listen(
        this._api,
        'playbackstatechange',
        this._onPlaybackStateChange,
        false
      )
      .listen(this._api, 'fullscreenchange', this._onFullscreenChange, false)
      .listen(this._api, 'sizechange', this._onSizeChange, false)
      .listen(this._api, 'loadedmetadata', this._onLoadedMetadata, false)
      .listen(this._api, 'settingsopen', this._onSettingsOpen, false)
      .listen(window, 'resize', this.resize, { passive: true });
  }

  public componentWillUnmount() {
    this._handler.removeAll();
  }

  public render(
    {  }: IPlayerProps,
    { maxPopupHeight }: IPlayerState
  ): JSX.Element {
    const chromelessRef = (el: ChromelessPlayer) => {
      this._chromelessPlayer = el;
      if (this.base) {
        this._chromelessPlayer.setFullscreenElement(this.base);
      }
    };
    const bottomRef = (el: ChromeBottomComponent) =>
      (this._bottomComponent = el);
    const cuedThumbnailRef = (el: CuedThumbnailComponent) =>
      (this._cuedThumbnailComponent = el);
    const tooltipRef = (el: ChromeTooltip) => (this._tooltipComponent = el);
    const actionRef = (el?: Element) => (this._actionElement = el);
    const bezelRef = (el: BezelComponent) => (this._bezelElement = el);

    const onProgressHover = (time: number, percentage: number) =>
      this._onProgressHover(time, percentage);
    const onProgressEndHover = () => this._onProgressEndHover();
    const onNextVideoHover = (detail: IVideoDetail) =>
      this._onNextVideoHover(detail);
    const onNextVideoEndHover = () => this._onNextVideoEndHover();
    const onSizeButtonHover = () => this._onSizeButtonHover();
    const onSizeButtonEndHover = () => this._onSizeButtonEndHover();
    const onFullscreenButtonHover = () => this._onFullscreenButtonHover();
    const onFullscreenButtonEndHover = () => this._onFullscreenButtonEndHover();
    const onVolumeMuteButtonHover = () => this._onVolumeMuteButtonHover();
    const onVolumeMuteButtonEndHover = () => this._onVolumeMuteButtonEndHover();
    const onSettingsButtonHover = () => this._onSettingsButtonHover();
    const onSettingsButtonEndHover = () => this._onSettingsButtonEndHover();
    const onCuedThumbnailClick = () => {
      if (!this._cuedThumbnailComponent)
        throw new Error('CuedThumbnailComponent is undefined');
      if (this._config && this._configCued) {
        this._updateChromelessPlayer(this._config);

        this._cuedThumbnailComponent.setVisible(false);

        this.setPreview(false);
        this.setAutoHide(true);

        this.resize();
      }
    };

    const attributes = {
      tabindex: '0'
    };

    const className =
      'html5-video-player' +
      ' ' +
      this._getStateClassName() +
      (this._api.isLarge() ? ' html5-video-player--large' : '');
    return (
      <div class={className} {...attributes}>
        <ChromelessPlayer
          ref={chromelessRef}
          api={this.getApi() as ChromelessPlayerApi}
        />
        <CuedThumbnailComponent
          ref={cuedThumbnailRef}
          onClick={onCuedThumbnailClick}
        />
        <BufferComponent api={this.getApi()} />
        <BezelComponent ref={bezelRef} />
        <div ref={actionRef} class="html5-video-action" />
        <ChromeTooltip ref={tooltipRef} />
        <ChromeSettingsPopup api={this.getApi()} maxHeight={maxPopupHeight} />
        <div class="html5-video-gradient-bottom" />
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
          onVolumeMuteButtonEndHover={onVolumeMuteButtonEndHover}
          onSettingsButtonHover={onSettingsButtonHover}
          onSettingsButtonEndHover={onSettingsButtonEndHover}
        />
      </div>
    );
  }

  private async _updateChromelessPlayer(config: IPlayerConfig) {
    if (!this._chromelessPlayer)
      throw new Error('ChromelessPlayer is undefined');

    this._configCued = false;
    if (config.subtitles) {
      const tracks: ISubtitleTrack[] = [];
      let defaultTrack: number = -1;
      const queries = parseSimpleQuery(location.search);

      for (let i = 0; i < config.subtitles.length; i++) {
        let useSubtitle = false;
        if (queries.hasOwnProperty('ssid')) {
          const id: string = queries.ssid;
          useSubtitle = config.subtitles[i].getId().toString() === id;
        } else {
          useSubtitle = config.subtitles[i].isDefault();
        }
        if (useSubtitle) {
          defaultTrack = i;
        }

        const subtitle = config.subtitles[i];
        tracks.push({
          label: subtitle.getTitle(),
          getContent: async (): Promise<string> => {
            const converter = new SubtitleToAss(subtitle);
            return await converter.getContentAsAss();
          }
        });
      }
      this._chromelessPlayer.setSubtitleTracks(tracks);
      this._chromelessPlayer.setSubtitleTrack(defaultTrack);
    }

    if (config.volume !== undefined) {
      this._chromelessPlayer.setVolume(config.volume);
    }

    if (config.muted !== undefined) {
      this._chromelessPlayer.setMuted(config.muted);
    }

    if (config.url) {
      this._chromelessPlayer.setVideoSource(
        new HlsSource(config.url),
        config.startTime
      );
    } else {
      this._chromelessPlayer.removeVideoSource();
    }

    if (typeof config.duration === 'number') {
      this._chromelessPlayer.setDuration(config.duration);
    } else {
      this._chromelessPlayer.setDuration(NaN);
    }
  }

  private _onSizeChange(): void {
    if (!this._tooltipComponent)
      throw new Error('TooltipComponent is undefined');

    const large = this._api.isLarge();
    if (large) {
      this.base.classList.add('html5-video-player--large');
    } else {
      this.base.classList.remove('html5-video-player--large');
    }

    if (this.props.onSizeChange) {
      this.props.onSizeChange(large);
    }

    this._tooltipComponent.base.style.display = 'none';

    this.resize();
  }

  private _onMouseMouse(e: BrowserEvent) {
    if (!this._bottomComponent) throw new Error('BottomComponent is undefined');

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
    if (!this._bezelElement) throw new Error('Bezel element is undefined');

    this._bezelElement.playSvgPath(d);
  }

  private _getStateClassName(): string {
    try {
      const state = this._api.getPlaybackState();
      switch (state) {
        case PlaybackState.PLAYING:
        case PlaybackState.BUFFERING:
          return 'playing-mode';
        case PlaybackState.PAUSED:
          return 'paused-mode';
        case PlaybackState.ENDED:
          return 'ended-mode';
        case PlaybackState.UNSTARTED:
        default:
          return 'unstarted-mode';
      }
    } catch (e) {
      return 'unstarted-mode';
    }
  }

  private _onPlaybackStateChange() {
    const state = this._api.getPlaybackState();
    if (state === PlaybackState.PLAYING) {
      this.setAutoHide(this._autoHide);
    } else {
      this.updateInternalAutoHide();
    }

    const unstarted = this.base.classList.contains('unstarted-mode');

    this.base.classList.remove(
      'playing-mode',
      'paused-mode',
      'ended-mode',
      'unstarted-mode'
    );
    this.base.classList.add(this._getStateClassName());

    if (unstarted) {
      this.resize();
    }
  }

  private _onFullscreenChange() {
    if (!this._tooltipComponent)
      throw new Error('TooltipComponent is undefined');

    const fullscreen = this._api.isFullscreen();
    this.setBigMode(fullscreen);
    if (fullscreen) {
      this.base.classList.add('html5-video-player--fullscreen');
    } else {
      this.base.classList.remove('html5-video-player--fullscreen');
    }
    this._tooltipComponent.base.style.display = 'none';

    this.resize();
  }

  private _setTooltip(tooltip: IChromeTooltip, left: number) {
    if (!this._tooltipComponent)
      throw new Error('TooltipComponent is undefined');
    if (!this._tooltipBottomRect)
      throw new Error('Tooltip bottom rect is undefined');

    if (this.isPreview()) {
      this._tooltipComponent.base.style.display = 'none';
      return;
    }
    this._tooltipComponent.setTooltip(tooltip);
    this._tooltipComponent.setPosition(0, 0);

    const rect = this._tooltipBottomRect;
    const size = this._tooltipComponent.getSize();

    left = left - size.width / 2;
    left = Math.min(
      Math.max(left, rect.left),
      rect.left + rect.width - size.width
    );

    this._tooltipComponent.setPosition(left, rect.top - size.height);
  }

  private _onProgressHover(time: number, percentage: number) {
    if (!this._tooltipBottomRect)
      throw new Error('TooltipBottomRect is undefined');

    this.base.classList.add('chrome-progress-bar-hover');

    const rect = this._tooltipBottomRect;
    this._setTooltip(
      {
        text: parseAndFormatTime(time)
      },
      rect.width * percentage + rect.left
    );
  }

  private _onProgressEndHover() {
    if (!this._tooltipComponent)
      throw new Error('TooltipComponent is undefined');

    this.base.classList.remove('chrome-progress-bar-hover');
    this._tooltipComponent.base.style.display = 'none';
  }

  private _onNextVideoHover(detail: IVideoDetail) {
    if (!this._nextVideoButtonRect)
      throw new Error('NextVideoButtonRect is undefined');

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
    this._setTooltip(tooltip, btnRect.left + btnRect.width / 2);
  }

  private _onNextVideoEndHover() {
    if (!this._tooltipComponent)
      throw new Error('TooltipComponent is undefined');

    this._tooltipComponent.base.style.display = 'none';
  }

  private _onSizeButtonHover() {
    if (!this._sizeButtonRect) throw new Error('SizeButtonRect is undefined');

    const btnRect = this._sizeButtonRect;
    this._setTooltip(
      {
        text: this._api.isLarge() ? 'Small' : 'Large'
      },
      btnRect.left + btnRect.width / 2
    );
  }

  private _onSizeButtonEndHover() {
    if (!this._tooltipComponent)
      throw new Error('TooltipComponent is undefined');

    this._tooltipComponent.base.style.display = 'none';
  }

  private _onFullscreenButtonHover() {
    if (!this._fullscreenButtonRect)
      throw new Error('FullscreenButtonRect is undefined');

    const btnRect = this._fullscreenButtonRect;
    this._setTooltip(
      {
        text: this._api.isFullscreen() ? 'Exit full screen' : 'Full screen'
      },
      btnRect.left + btnRect.width / 2
    );
  }

  private _onFullscreenButtonEndHover() {
    if (!this._tooltipComponent)
      throw new Error('TooltipComponent is undefined');

    this._tooltipComponent.base.style.display = 'none';
  }

  private _onVolumeMuteButtonHover() {
    if (!this._volumeMuteButtonRect)
      throw new Error('VolumeMuteButtonRect is undefined');

    const btnRect = this._volumeMuteButtonRect;
    this._setTooltip(
      {
        text:
          this._api.isMuted() || this._api.getVolume() === 0 ? 'Unmute' : 'Mute'
      },
      btnRect.left + btnRect.width / 2
    );
  }

  private _onVolumeMuteButtonEndHover() {
    if (!this._tooltipComponent)
      throw new Error('TooltipComponent is undefined');

    this._tooltipComponent.base.style.display = 'none';
  }

  private _onSettingsButtonHover() {
    if (this._api.isSettingsOpen()) return;
    if (!this._settingsButtonRect)
      throw new Error('SettingsButtonRect is undefined');

    const btnRect = this._settingsButtonRect;
    this._setTooltip(
      {
        text: 'Settings'
      },
      btnRect.left + btnRect.width / 2
    );
  }

  private _onSettingsButtonEndHover() {
    if (!this._tooltipComponent)
      throw new Error('TooltipComponent is undefined');

    this._tooltipComponent.base.style.display = 'none';
  }

  private _onSettingsOpen() {
    if (this._tooltipComponent) {
      this._tooltipComponent.base.style.display = 'none';
    }
  }

  private _onActionMouseDown(e: BrowserEvent) {
    e.preventDefault();
  }

  private _onActionClick(e: BrowserEvent) {
    this.base.focus();

    if (typeof this._actionClickTimer === 'number') {
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

      const isPlaying =
        api.getPreferredPlaybackState() === PlaybackState.PLAYING;
      if (isPlaying) {
        api.pauseVideo();
      } else {
        api.playVideo();
      }
    }, 200);
  }

  private _onActionDoubleClick(e: BrowserEvent) {
    if (!this._bezelElement) throw new Error('BezelELement is undefined');

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
}

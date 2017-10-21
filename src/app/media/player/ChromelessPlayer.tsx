import { h, Component } from 'preact';
import { ISource } from './ISource';
import { EventHandler } from '../../libs/events/EventHandler';
import { BrowserEvent } from '../../libs/events/BrowserEvent';
import { ISubtitleEngine } from '../subtitles/ISubtitleEngine';
import { SubtitleContainerComponent } from './SubtitleContainerComponent';
import { LibAssSubtitleEngine } from '../subtitles/LibAssSubtitleEngine';
import { ISubtitleTrack } from '../subtitles/ISubtitleTrack';
import { IRect } from '../../utils/rect';
import { IPlayerApi, PlaybackState, PlaybackStateChangeEvent, TimeUpdateEvent, VolumeChangeEvent, DurationChangeEvent } from './IPlayerApi';
import { getFullscreenElement, requestFullscreen, exitFullscreen } from '../../utils/fullscreen';
import { ChromelessPlayerApi } from './ChromelessPlayerApi';

export interface IChromelessPlayerProps {
  src?: ISource;
  fullscreenElement?: HTMLElement;
  api?: ChromelessPlayerApi;
}

export class ChromelessPlayer extends Component<IChromelessPlayerProps, {}> {
  private _containerElement: HTMLElement;
  private _videoElement: HTMLVideoElement;

  private _source: ISource|undefined = undefined;
  private _subtitleEngine = new LibAssSubtitleEngine();
  private _subtitleTracks: ISubtitleTrack[] = [];
  private _currentSubtitleTrack: number = -1;

  private _state: PlaybackState = PlaybackState.UNSTARTED;
  private _preferedState: PlaybackState|undefined = PlaybackState.PLAYING;

  private _handler = new EventHandler(this);

  private _fullscreenElement: HTMLElement|undefined;

  private _api: IPlayerApi;

  private _subtitleLoading: boolean = false;

  constructor(props: IChromelessPlayerProps) {
    super(props);

    if (props.fullscreenElement) {
      this._fullscreenElement = props.fullscreenElement;
    }
    if (props.api) {
      props.api.setChromelessPlayer(this);
      this._api = props.api;
    }
  }

  private _updateState(state: PlaybackState) {
    console.log("state", PlaybackState[state]);
    this._state = state;

    this._api.dispatchEvent(new PlaybackStateChangeEvent(state));
  }
  
  private _onPlaying(e: BrowserEvent) {
    if (this._subtitleLoading) {
      this._videoElement.pause();
      return;
    }

    const state = this._preferedState;
    switch (state) {
      case PlaybackState.PAUSED:
        this._preferedState = undefined;
        this._videoElement.pause();
        break;
      default:
        this._updateState(PlaybackState.PLAYING);
        break;
    }
  }
  
  private _onPause(e: BrowserEvent) {
    if (this._subtitleLoading) {
      return;
    }

    const state = this._preferedState;
    switch (state) {
      case PlaybackState.PLAYING:
        this._videoElement.play();
        break;
      default:
        this._updateState(PlaybackState.PAUSED);
        break;
    }
  }
  
  private _onEnded(e: BrowserEvent) {
    this._updateState(PlaybackState.ENDED);
    this._preferedState = undefined;
  }

  private _onCanplay() {
    if (this._subtitleLoading) {
      this._videoElement.pause();
      return;
    }

    const state = this._preferedState;

    switch (state) {
      case PlaybackState.PAUSED:
        this._videoElement.pause();
      default:
        this._videoElement.play();
    }
  }

  private _isBuffering(): boolean {
    const video = this._videoElement;
    return video.readyState < video.HAVE_FUTURE_DATA;
  }
  
  private _onStalled(e: BrowserEvent) {
    if (this._isBuffering()) {
      this._updateState(PlaybackState.BUFFERING);
    }
  }
  
  private _onSuspend(e: BrowserEvent) {
    this._onStalled(e);
  }
  
  private _onWaiting(e: BrowserEvent) {
    this._onStalled(e);
  }

  private _onLoadedMetadata() {
    this.resize();
  }

  private _onTimeUpdate() {
    this._api.dispatchEvent(new TimeUpdateEvent(this.getCurrentTime()));
  }

  private _onVolumeChange() {
    this._api.dispatchEvent(new VolumeChangeEvent(this.getVolume()));
  }
  
  private _onProgress() {
    this._api.dispatchEvent('progress');
  }

  private _onDurationChange() {
    this._api.dispatchEvent(new DurationChangeEvent(this.getDuration()));
  }

  private resizeVideo() {
    const video = this._videoElement;

    const rect = this.getVideoRect();

    video.style.width = rect.width + "px";
    video.style.height = rect.height + "px";
    video.style.left = rect.left + "px";
    video.style.top = rect.top + "px";
  }
  
  private resizeSubtitle() {
    const engine = this._subtitleEngine;
    const video = this._videoElement;

    var rect = engine.getRect();
    const videoRect = this.getVideoRect();

    var el = engine.getElement() as HTMLElement;
    el.style.width = rect.width + "px";
    el.style.height = rect.height + "px";

    var offsetLeft = videoRect.left;
    var offsetTop = videoRect.top;

    el.style.left = Math.floor(rect.x - offsetLeft) + "px";
    el.style.top = Math.floor(rect.y - offsetTop) + "px";
  }

  setApi(api: ChromelessPlayerApi) {
    api.setChromelessPlayer(this);
    this._api = api;
  }

  getApi(): IPlayerApi {
    return this._api;
  }

  getPlaybackState(): PlaybackState {
    return this._state;
  }

  getPreferredPlaybackState(): PlaybackState {
    if (this._preferedState !== undefined) {
      return this._preferedState;
    }
    return this._state;
  }
  
  getVideoRect(): IRect {
    const video = this._videoElement;
    
    const videoWidth: number = video.videoWidth;
    const videoHeight: number = video.videoHeight;

    var maxWidth: number = this._containerElement.offsetWidth;
    var maxHeight: number = this._containerElement.offsetHeight;

    let videoRatio = videoWidth / videoHeight;
    if (!isFinite(videoRatio)) {
      videoRatio = 16/9;
    }
    const elementRatio = maxWidth / maxHeight;

    var realWidth = maxWidth;
    var realHeight = maxHeight;

    if (elementRatio > videoRatio) {
      realWidth = Math.ceil(maxHeight * videoRatio);
    } else {
      realHeight = Math.ceil(maxWidth / videoRatio);
    }

    return {
      width: realWidth,
      height: realHeight,
      left: Math.floor((maxWidth - realWidth) / 2),
      top: Math.floor((maxHeight - realHeight) / 2)
    };
  }
  
  resize() {
    this.resizeVideo();
    this.resizeSubtitle();
  }

  playVideo() {
    switch (this._state) {
      case PlaybackState.ENDED:
        if (!this._subtitleLoading) {
          this._videoElement.currentTime = 0;
          this._videoElement.play();
          break;
        }
      case PlaybackState.PLAYING:
        if (this._subtitleLoading) {
          this._preferedState = PlaybackState.PLAYING;
          this._api.dispatchEvent(new PlaybackStateChangeEvent(this._preferedState));
        }
        break;
      case PlaybackState.PAUSED:
        if (this._subtitleLoading) {
          this._preferedState = PlaybackState.PLAYING;
          this._api.dispatchEvent(new PlaybackStateChangeEvent(this._preferedState));
        } else {
          this._videoElement.play();
        }
        break;
      default:
        this._preferedState = PlaybackState.PLAYING;
        this._api.dispatchEvent(new PlaybackStateChangeEvent(this._preferedState));
        break;
    }
  }

  pauseVideo() {
    switch (this._state) {
      case PlaybackState.PAUSED:
        if (this._subtitleLoading) {
          this._preferedState = PlaybackState.PAUSED;
          this._api.dispatchEvent(new PlaybackStateChangeEvent(this._preferedState));
        }
        break;
      case PlaybackState.PLAYING:
        if (this._subtitleLoading) {
          this._preferedState = PlaybackState.PAUSED;
          this._api.dispatchEvent(new PlaybackStateChangeEvent(this._preferedState));
        } else {
          this._videoElement.pause();
        }
        break;
      default:
        this._preferedState = PlaybackState.PAUSED;
        this._api.dispatchEvent(new PlaybackStateChangeEvent(this._preferedState));
        break;
    }
  }

  seekTo(time: number): void {
    this._videoElement.currentTime = time;
  }

  seekBy(seconds: number): void {
    this._videoElement.currentTime += seconds;
  }

  getDuration(): number {
    return this._videoElement.duration;
  }

  getCurrentTime(): number {
    return this._videoElement.currentTime;
  }

  setVolume(volume: number): void {
    this._videoElement.volume = volume;
  }

  getVolume(): number {
    return this._videoElement.volume;
  }
  
  isFullscreen(): boolean {
    const element = this._fullscreenElement || this._containerElement;
    return element === getFullscreenElement();
  }

  enterFullscreen(): void {
    if (this.isFullscreen()) return;

    const element = this._fullscreenElement || this._containerElement;
    requestFullscreen(element);
  }

  exitFullscreen(): void {
    if (!this.isFullscreen()) return;

    exitFullscreen();
  }

  toggleFullscreen(): void {
    if (this.isFullscreen()) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  /**
   * Set the video source.
   * @param source the video source.
   */
  setVideoSource(source: ISource): void {
    if (this._source) {
      this._source.detach();
    }
    this._source = source;

    this._source.attach(this._videoElement);
  }

  async setSubtitleTrack(index: number): Promise<any> {
    this._currentSubtitleTrack = index;
    if (index === -1) {
      this._subtitleLoading = false;
      this._subtitleEngine.detach();
      this._api.dispatchEvent('subtitletrackchange');
    } else {
      this._subtitleLoading = true;
      if (this._state === PlaybackState.PLAYING) {
        this._videoElement.pause();
      }
      const content = await this._subtitleTracks[index].getContent();
      if (this._currentSubtitleTrack === index) {
        this._subtitleEngine.setTrack(content);
        this._subtitleEngine.attach(this._videoElement);
        this._subtitleLoading = false;

        this._onCanplay();

        this._api.dispatchEvent('subtitletrackchange');
      }
    }
  }

  setSubtitleTracks(tracks: ISubtitleTrack[]): void {
    this._subtitleTracks = tracks;
    this._currentSubtitleTrack = -1;

    this._subtitleEngine.detach();

    if (this._subtitleLoading) {
      this._subtitleLoading = false;
      this._onCanplay();
    }
    
    this._api.dispatchEvent('subtitletrackschange');
    this._api.dispatchEvent('subtitletrackchange');
  }

  getSubtitleTracks(): ISubtitleTrack[] {
    return this._subtitleTracks;
  }

  componentDidMount() {
    this._subtitleEngine.attach(this._videoElement);
    if (this._source) {
      this._source.attach(this._videoElement);
    }

    this.resize();
    
    this._handler
      .listen(this._videoElement, 'playing', this._onPlaying, false)
      .listen(this._videoElement, 'pause', this._onPause, false)
      .listen(this._videoElement, 'ended', this._onEnded, false)
      .listen(this._videoElement, 'canplay', this._onCanplay, false)
      .listen(this._videoElement, 'stalled', this._onStalled, false)
      .listen(this._videoElement, 'suspend', this._onSuspend, false)
      .listen(this._videoElement, 'waiting', this._onWaiting, false)
      .listen(this._videoElement, 'loadedmetadata', this._onLoadedMetadata, false)
      .listen(this._videoElement, 'timeupdate', this._onTimeUpdate, false)
      .listen(this._videoElement, 'durationchange', this._onDurationChange, false)
      .listen(this._videoElement, 'progress', this._onProgress, false)
      .listen(this._videoElement, 'volumechange', this._onVolumeChange, false)
      .listen(this._subtitleEngine, 'resize', this.resizeSubtitle, false);
    this._videoElement.play();
  }

  componentWillUnmount() {
    this._subtitleEngine.detach();
    if (this._source) {
      this._source.detach();
    }
    this._handler.removeAll();
  }
  
  render(): JSX.Element {
    const attributes: {[key: string]: string} = {
      'controlslist': 'nodownload'
    };
    const videoRef = (element: HTMLVideoElement) => {
      this._videoElement = element;
    };
    const containerRef = (element: HTMLVideoElement) => {
      this._containerElement = element;
    };
    return (
      <div class="html5-video-container" ref={ containerRef }>
        <video ref={ videoRef } class="video-stream" { ...attributes }></video>
        <SubtitleContainerComponent engine={ this._subtitleEngine }></SubtitleContainerComponent>
      </div>
    );
  }
}
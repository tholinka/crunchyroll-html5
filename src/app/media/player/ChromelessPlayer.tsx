import { Component, h } from 'preact';
import { BrowserEvent } from '../../libs/events/BrowserEvent';
import { EventHandler } from '../../libs/events/EventHandler';
import {
  exitFullscreen,
  getFullscreenElement,
  requestFullscreen
} from '../../utils/fullscreen';
import { IRect } from '../../utils/rect';
import { ISubtitleTrack } from '../subtitles/ISubtitleTrack';
import { LibAssSubtitleEngine } from '../subtitles/LibAssSubtitleEngine';
import { ChromelessPlayerApi } from './ChromelessPlayerApi';
import { DurationChangeEvent } from './DurationChangeEvent';
import { IPlayerApi, PlaybackState } from './IPlayerApi';
import { ISource } from './ISource';
import { PlaybackRateChangeEvent } from './PlaybackRateChangeEvent';
import { PlaybackStateChangeEvent } from './PlaybackStateChangeEvent';
import { SeekEvent } from './SeekEvent';
import { SubtitleContainerComponent } from './SubtitleContainerComponent';
import { TimeUpdateEvent } from './TimeUpdateEvent';
import { VolumeChangeEvent } from './VolumeChangeEvent';

export interface IChromelessPlayerProps {
  src?: ISource;
  fullscreenElement?: HTMLElement;
  api?: ChromelessPlayerApi;
}

export class ChromelessPlayer extends Component<IChromelessPlayerProps, {}> {
  private _containerElement?: HTMLElement;
  private _videoElement?: HTMLVideoElement;

  private _source: ISource | undefined = undefined;
  private _subtitleEngine = new LibAssSubtitleEngine();
  private _subtitleTracks: ISubtitleTrack[] = [];
  private _currentSubtitleTrack: number = -1;

  private _state: PlaybackState = PlaybackState.UNSTARTED;
  private _preferedState: PlaybackState | undefined = PlaybackState.PLAYING;
  private _forcedPause: boolean = false;

  private _handler = new EventHandler(this);

  private _fullscreenElement: HTMLElement | undefined;

  private _api?: IPlayerApi;

  private _subtitleLoading: boolean = false;
  private _lastFullscreenState: boolean = false;

  private _duration: number = NaN;

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

  public setForcePaused(force: boolean): void {
    if (!this._videoElement) throw new Error('Video element is undefined');

    this._forcedPause = force;
    if (this._forcedPause) {
      this._videoElement.pause();
    } else {
      this._onCanplay();
    }
  }

  public setApi(api: ChromelessPlayerApi) {
    api.setChromelessPlayer(this);
    this._api = api;
  }

  public getApi(): IPlayerApi {
    if (!this._api) throw new Error('API is undefined');

    return this._api;
  }

  public getPlaybackState(): PlaybackState {
    return this._state;
  }

  public getPreferredPlaybackState(): PlaybackState {
    if (this._preferedState !== undefined) {
      return this._preferedState;
    }
    return this._state;
  }

  public getVideoRect(): IRect {
    if (!this._videoElement) throw new Error('Video element is undefined');
    if (!this._containerElement)
      throw new Error('Container element is undefined');

    const video = this._videoElement;

    const videoWidth: number = video.videoWidth;
    const videoHeight: number = video.videoHeight;

    const maxWidth: number = this._containerElement.offsetWidth;
    const maxHeight: number = this._containerElement.offsetHeight;

    let videoRatio = videoWidth / videoHeight;
    if (!isFinite(videoRatio)) {
      videoRatio = 16 / 9;
    }
    const elementRatio = maxWidth / maxHeight;

    let realWidth = maxWidth;
    let realHeight = maxHeight;

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

  public resize() {
    if (!this._api) throw new Error('API is undefined');

    this.resizeVideo();
    this.resizeSubtitle();

    this._subtitleEngine.resize();

    this._api.dispatchEvent('resize');
  }

  public getVideoElement(): HTMLVideoElement {
    if (!this._videoElement) throw new Error('Video element is undefined');

    return this._videoElement;
  }

  public playVideo() {
    if (!this._videoElement) throw new Error('Video element is undefined');
    if (!this._api) throw new Error('API is undefined');

    this._preferedState = PlaybackState.PLAYING;
    switch (this._forcedPause ? undefined : this._state) {
      case PlaybackState.ENDED:
        if (!this._subtitleLoading) {
          this._videoElement.currentTime = 0;
          this._play();
          break;
        }
      case PlaybackState.PLAYING:
        if (this._subtitleLoading) {
          this._api.dispatchEvent(
            new PlaybackStateChangeEvent(this._preferedState)
          );
        }
        break;
      case PlaybackState.PAUSED:
        if (this._subtitleLoading) {
          this._api.dispatchEvent(
            new PlaybackStateChangeEvent(this._preferedState)
          );
        } else {
          this._play();
        }
        break;
      default:
        this._api.dispatchEvent(
          new PlaybackStateChangeEvent(this._preferedState)
        );
        break;
    }
  }

  public pauseVideo() {
    if (!this._videoElement) throw new Error('Video element is undefined');
    if (!this._api) throw new Error('API is undefined');

    this._preferedState = PlaybackState.PAUSED;
    switch (this._state) {
      case PlaybackState.PAUSED:
        if (this._subtitleLoading) {
          this._api.dispatchEvent(
            new PlaybackStateChangeEvent(this._preferedState)
          );
        }
        break;
      case PlaybackState.PLAYING:
        if (this._subtitleLoading) {
          this._api.dispatchEvent(
            new PlaybackStateChangeEvent(this._preferedState)
          );
        } else {
          this._videoElement.pause();
        }
        break;
      default:
        this._api.dispatchEvent(
          new PlaybackStateChangeEvent(this._preferedState)
        );
        break;
    }
  }

  public seekTo(time: number): void {
    if (!this._videoElement) throw new Error('Video element is undefined');
    if (!this._api) throw new Error('API is undefined');

    this._videoElement.currentTime = time;
    this._api.dispatchEvent(new SeekEvent(time));
    this._api.dispatchEvent(new TimeUpdateEvent(time));
  }

  public seekBy(seconds: number): void {
    if (!this._videoElement) throw new Error('Video element is undefined');
    if (!this._api) throw new Error('API is undefined');

    const time = this._videoElement.currentTime + seconds;
    this._videoElement.currentTime = time;
    this._api.dispatchEvent(new SeekEvent(time));
    this._api.dispatchEvent(new TimeUpdateEvent(time));
  }

  public getDuration(): number {
    if (!this._videoElement) throw new Error('Video element is undefined');

    const duration = this._videoElement.duration;
    if (isNaN(duration)) {
      return Math.floor(this._duration);
    }
    return duration;
  }

  public setDuration(duration: number) {
    if (!this._api) throw new Error('API is undefined');

    this._duration = duration;

    this._api.dispatchEvent(new DurationChangeEvent(this.getDuration()));
  }

  public getCurrentTime(): number {
    if (!this._videoElement) throw new Error('Video element is undefined');

    return this._videoElement.currentTime;
  }

  public getBufferedTime(): number {
    if (!this._videoElement) throw new Error('Video element is undefined');

    let value: number = 0;

    for (let i = 0; i < this._videoElement.buffered.length; i++) {
      value = Math.max(value, this._videoElement.buffered.end(i));
    }

    return value;
  }

  public setVolume(volume: number): void {
    if (!this._videoElement) throw new Error('Video element is undefined');

    this._videoElement.volume = volume;

    if (!this._source) {
      this._onVolumeChange();
    }
  }

  public getVolume(): number {
    if (!this._videoElement) throw new Error('Video element is undefined');

    return this._videoElement.volume;
  }

  public setMuted(muted: boolean): void {
    if (!this._videoElement) throw new Error('Video element is undefined');

    this._videoElement.muted = muted;

    if (!this._source) {
      this._onVolumeChange();
    }
  }

  public mute(): void {
    this.setMuted(true);
  }

  public unmute(): void {
    this.setMuted(false);
  }

  public isMuted(): boolean {
    if (!this._videoElement) throw new Error('Video element is undefined');

    return this._videoElement.muted;
  }

  public setFullscreenElement(element: HTMLElement): void {
    this._fullscreenElement = element;
  }

  public isFullscreen(): boolean {
    const element = this._fullscreenElement || this._containerElement;
    return element === getFullscreenElement();
  }

  public enterFullscreen(): void {
    if (!this._containerElement)
      throw new Error('Container element is undefined');

    if (this.isFullscreen()) return;

    const element = this._fullscreenElement || this._containerElement;
    requestFullscreen(element);
    element.focus();
  }

  public exitFullscreen(): void {
    if (!this.isFullscreen()) return;

    exitFullscreen();
  }

  public toggleFullscreen(): void {
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
  public setVideoSource(source: ISource, startTime: number = 0): void {
    if (!this._videoElement) throw new Error('Video element is undefined');
    if (!this._api) throw new Error('API is undefined');

    if (this._source) {
      this._source.detach();
      this._source.dispose();
    }
    this._source = source;

    this._source.attach(this._videoElement);

    this._videoElement.currentTime = startTime;

    this._api.dispatchEvent(new TimeUpdateEvent(startTime));
  }

  public removeVideoSource(): void {
    if (this._source) {
      this._source.detach();
      this._source.dispose();
      this._source = undefined;
    }
  }

  public getPlaybackRate(): number {
    if (!this._videoElement) throw new Error('Video element is undefined');
    return this._videoElement.playbackRate;
  }

  public setPlaybackRate(rate: number) {
    if (!this._videoElement) throw new Error('Video element is undefined');
    this._videoElement.playbackRate = rate;
  }

  public async setSubtitleTrack(index: number): Promise<any> {
    if (!this._videoElement) throw new Error('Video element is undefined');
    if (!this._api) throw new Error('API is undefined');

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

  public getCurrentSubtitleTrack(): number {
    return this._currentSubtitleTrack;
  }

  public setSubtitleTracks(tracks: ISubtitleTrack[]): void {
    if (!this._api) throw new Error('API is undefined');

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

  public getSubtitleTracks(): ISubtitleTrack[] {
    return this._subtitleTracks;
  }

  public componentDidMount() {
    if (!this._videoElement) throw new Error('Video element is undefined');

    this._handler
      .listen(this._videoElement, 'playing', this._onPlaying, false)
      .listen(this._videoElement, 'pause', this._onPause, false)
      .listen(this._videoElement, 'ended', this._onEnded, false)
      .listen(this._videoElement, 'canplay', this._onCanplay, false)
      .listen(this._videoElement, 'stalled', this._onStalled, false)
      .listen(this._videoElement, 'suspend', this._onSuspend, false)
      .listen(this._videoElement, 'waiting', this._onWaiting, false)
      .listen(this._videoElement, 'seeked', this._onSeeked, false)
      .listen(
        this._videoElement,
        'loadedmetadata',
        this._onLoadedMetadata,
        false
      )
      .listen(this._videoElement, 'timeupdate', this._onTimeUpdate, false)
      .listen(this._videoElement, 'ratechange', this._onRateChange, false)
      .listen(
        this._videoElement,
        'durationchange',
        this._onDurationChange,
        false
      )
      .listen(this._videoElement, 'progress', this._onProgress, false)
      .listen(this._videoElement, 'volumechange', this._onVolumeChange, false)
      .listen(this._subtitleEngine, 'resize', this.resizeSubtitle, false)
      .listen(document, 'fullscreenchange', this._onFullscreenChange)
      .listen(document, 'webkitfullscreenchange', this._onFullscreenChange)
      .listen(document, 'mozfullscreenchange', this._onFullscreenChange)
      .listen(document, 'msfullscreenchange', this._onFullscreenChange)
      .listen(window, 'resize', this.resize, { passive: true });
    this._subtitleEngine.attach(this._videoElement);
    if (this._source) {
      this.setVideoSource(this._source, undefined);
    }
    this.resize();
  }

  public componentWillUnmount() {
    this._subtitleEngine.detach();
    if (this._source) {
      this._source.detach();
    }
    this._handler.removeAll();
  }

  public render(): JSX.Element {
    const attributes: { [key: string]: string } = {
      controlslist: 'nodownload'
    };
    const videoRef = (element?: Element) => {
      this._videoElement = element as HTMLVideoElement;
    };
    const containerRef = (element?: Element) => {
      this._containerElement = element as HTMLVideoElement;
    };
    return (
      <div class="html5-video-container" ref={containerRef}>
        <video
          ref={videoRef}
          class="video-stream"
          autoPlay={true}
          {...attributes}
        />
        <SubtitleContainerComponent engine={this._subtitleEngine} />
      </div>
    );
  }

  private _play() {
    if (!this._videoElement) throw new Error('Video element is undefined');

    this._videoElement.play().then(null, (err: Error) => {
      const name = err.name;

      if (name === 'NotAllowedError') {
        // It failed to auto-play, set to pause state instead.
        this._preferedState = PlaybackState.PAUSED;
        this._updateState(this._preferedState);
      } else if (name === 'NotSupportedError') {
        console.error(err);
      }
    });
  }

  private _updateState(state: PlaybackState) {
    if (!this._api) throw new Error('API is undefined');

    this._state = state;

    this._api.dispatchEvent(new PlaybackStateChangeEvent(state));
  }

  private _onPlaying(e: BrowserEvent) {
    if (!this._videoElement) throw new Error('Video element is undefined');

    if (this._subtitleLoading) {
      this._videoElement.pause();
      return;
    }

    const state = this._preferedState;
    switch (state) {
      case PlaybackState.PAUSED:
        this._videoElement.pause();
        break;
      default:
        if (this._forcedPause) {
          this._videoElement.pause();
        }
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
        break;
      default:
        this._updateState(PlaybackState.PAUSED);
        break;
    }
  }

  private _onEnded(e: BrowserEvent) {
    this._preferedState = undefined;
    this._updateState(PlaybackState.ENDED);
  }

  private _onCanplay() {
    if (!this._videoElement) throw new Error('Video element is undefined');

    if (this._subtitleLoading) {
      this._videoElement.pause();
      return;
    }

    const state = this._preferedState;

    switch (state) {
      case PlaybackState.PAUSED:
        this._videoElement.pause();
        break;
      default:
        this._play();
        break;
    }
  }

  private _isBuffering(): boolean {
    if (!this._videoElement) throw new Error('Video element is undefined');

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
    if (!this._api) throw new Error('API is undefined');

    this.resize();

    this._api.dispatchEvent('loadedmetadata');
  }

  private _onTimeUpdate() {
    if (!this._api) throw new Error('API is undefined');

    this._api.dispatchEvent(new TimeUpdateEvent(this.getCurrentTime()));
  }

  private _onRateChange() {
    if (!this._api) throw new Error('API is undefined');

    this._api.dispatchEvent(
      new PlaybackRateChangeEvent(this.getPlaybackRate())
    );
  }

  private _onVolumeChange() {
    if (!this._api) throw new Error('API is undefined');

    this._api.dispatchEvent(
      new VolumeChangeEvent(this.getVolume(), this.isMuted())
    );
  }

  private _onProgress() {
    if (!this._api) throw new Error('API is undefined');

    this._api.dispatchEvent('progress');
  }

  private _onDurationChange() {
    if (!this._api) throw new Error('API is undefined');

    this._api.dispatchEvent(new DurationChangeEvent(this.getDuration()));
  }

  private _onSeeked() {
    if (!this._videoElement) throw new Error('Video element is undefined');

    if (this._forcedPause) {
      this._videoElement.pause();
    } else {
      this._onCanplay();
    }
  }

  private _onFullscreenChange() {
    if (!this._api) throw new Error('API is undefined');

    const fullscreen = this.isFullscreen();
    if (this._lastFullscreenState === fullscreen) return;
    this._lastFullscreenState = fullscreen;

    this._api.dispatchEvent('fullscreenchange');
  }

  private resizeVideo() {
    if (!this._videoElement) throw new Error('Video element is undefined');

    const video = this._videoElement;

    const rect = this.getVideoRect();

    video.style.width = rect.width + 'px';
    video.style.height = rect.height + 'px';
    video.style.left = rect.left + 'px';
    video.style.top = rect.top + 'px';
  }

  private resizeSubtitle() {
    const engine = this._subtitleEngine;
    const video = this._videoElement;

    const rect = engine.getRect();
    const videoRect = this.getVideoRect();

    const el = engine.getElement() as HTMLElement;
    el.style.width = rect.width + 'px';
    el.style.height = rect.height + 'px';

    const offsetLeft = videoRect.left;
    const offsetTop = videoRect.top;

    el.style.left = Math.floor(offsetLeft - rect.x) + 'px';
    el.style.top = Math.floor(offsetTop - rect.y) + 'px';
  }
}

import { h, Component } from 'preact';
import { ISource } from './ISource';
import { ISubtitleTrack } from './ISubtitleTrack';
import { EventHandler } from '../../libs/events/EventHandler';
import { BrowserEvent } from '../../libs/events/BrowserEvent';

export interface IChromelessPlayerProps {
  src?: ISource;
  onPlaybackStateChange?: (state: PlaybackState) => void;
}

export enum PlaybackState {
  UNSTARTED,
  PAUSED,
  PLAYING,
  BUFFERING,
  ENDED
}

export class ChromelessPlayer extends Component<IChromelessPlayerProps, {}> {
  private _videoElement: HTMLVideoElement|undefined = undefined;
  private _source: ISource|undefined = undefined;

  private _state: PlaybackState = PlaybackState.UNSTARTED;
  private _preferedState: PlaybackState|undefined = undefined;

  private _handler = new EventHandler(this);

  constructor() {
    super();
  }

  private _updateState(state: PlaybackState) {
    this._state = state;

    if (this.props.onPlaybackStateChange) {
      this.props.onPlaybackStateChange(state);
    }
  }
  
  private _onVideoElementReference(element: HTMLVideoElement) {
    this._videoElement = element;
    if (this._source) {
      this._source.attach(this._videoElement);
    }

    this._handler
      .listen(this._videoElement, 'playing', this._onPlaying, false)
      .listen(this._videoElement, 'pause', this._onPause, false)
      .listen(this._videoElement, 'ended', this._onEnded, false)
      .listen(this._videoElement, 'canplay', this._onCanplay, false)
      .listen(this._videoElement, 'stalled', this._onStalled, false)
      .listen(this._videoElement, 'suspend', this._onSuspend, false)
      .listen(this._videoElement, 'waiting', this._onWaiting, false);
  }
  
  private _onPlaying(e: BrowserEvent) {
    const state = this._preferedState;
    this._preferedState = undefined;
    switch (state) {
      case PlaybackState.PAUSED:
        this._preferedState = undefined;
        if (this._videoElement) {
          this._videoElement.pause();
        }
        break;
      default:
        this._updateState(PlaybackState.PLAYING);
        break;
    }
  }
  
  private _onPause(e: BrowserEvent) {
    const state = this._preferedState;
    this._preferedState = undefined;
    switch (state) {
      case PlaybackState.PLAYING:
        if (this._videoElement) {
          this._videoElement.play();
        }
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

  private _onCanplay(e: BrowserEvent) {
    const state = this._preferedState;
    this._preferedState = undefined;

    if (!this._videoElement) return;

    switch (state) {
      case PlaybackState.PAUSED:
        this._videoElement.pause();
      default:
        this._videoElement.play();
    }
  }
  
  private _onStalled(e: BrowserEvent) {
    if (!this._videoElement) return;
    const video = this._videoElement;
    if (
      video.networkState === video.NETWORK_LOADING ||
      video.readyState < video.HAVE_FUTURE_DATA
    ) {
      this._updateState(PlaybackState.BUFFERING);
    }
  }
  
  private _onSuspend(e: BrowserEvent) {
    this._onStalled(e);
  }
  
  private _onWaiting(e: BrowserEvent) {
    this._onStalled(e);
  }

  play() {
    switch (this._state) {
      case PlaybackState.PLAYING:
        break;
      case PlaybackState.PAUSED:
        if (this._videoElement) {
          this._videoElement.play();
          break;
        }
      default:
        this._preferedState = PlaybackState.PLAYING;
        break;
    }
  }

  pause() {
    switch (this._state) {
      case PlaybackState.PAUSED:
        break;
      case PlaybackState.PLAYING:
        if (this._videoElement) {
          this._videoElement.pause();
          break;
        }
      default:
        this._preferedState = PlaybackState.PAUSED;
        break;
    }
  }

  render(): JSX.Element {
    const attributes: {[key: string]: string} = {
      'controlslist': 'nodownload'
    };
    const ref = (element: HTMLVideoElement) => {
      this._onVideoElementReference(element);
    };
    return (
      <div class="html5-video-container">
        <video ref={ref} class="video-stream" { ...attributes }></video>
      </div>
    );
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

    if (this._videoElement) {
       this._source.attach(this._videoElement);
    }
  }

  setSubtitleTrack(track: ISubtitleTrack): void {

  }
}
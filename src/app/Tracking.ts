import { IPlayerApi, TimeUpdateEvent, SeekEvent, PlaybackStateChangeEvent, PlaybackState } from "./media/player/IPlayerApi";
import { EventHandler } from "./libs/events/EventHandler";
import { Stream } from "./media/video";
import { trackProgress } from "./media/crunchyroll";
import { Disposable } from "./libs/disposable/Disposable";

export class VideoTracker extends Disposable {
  private _handler: EventHandler = new EventHandler(this);

  private _stream: Stream;
  private _api: IPlayerApi;
  private _elapsedTime: number = 0;
  private _lastTime: number = 0;

  private _intervals: number[];
  private _callCount: number = 0;

  constructor(stream: Stream, api: IPlayerApi) {
    super();

    this._stream = stream;
    this._api = api;
    this._intervals = stream.pingBackIntervals;

    this._handler
      .listen(api, 'playbackstatechange', this._onPlaybackStateChange, false)
      .listen(api, 'seek', this._onSeek, false)
      .listen(api, 'timeupdate', this._onTimeUpdate, false);
  }

  protected disposeInternal() {
    super.disposeInternal();

    this._handler.dispose();
  }

  private _track(time: number, interval: number) {
    this._elapsedTime = 0;
    this._callCount++;

    trackProgress(this._stream, time, interval, this._callCount);
  }

  private _getInterval() {
    const intervalIndex = Math.min(this._callCount, this._intervals.length - 1);

    return this._intervals[intervalIndex]/1000;
  }

  private _onPlaybackStateChange(e: PlaybackStateChangeEvent) {
    if (e.state !== PlaybackState.ENDED) return;

    this._track(this._api.getDuration(), this._getInterval());
  }
  
  private _onSeek(e: SeekEvent) {
    this._lastTime = e.time;
  }
  
  private _onTimeUpdate(e: TimeUpdateEvent) {
    const dt = Math.max(e.time - this._lastTime, 0);
    this._lastTime = e.time;

    this._elapsedTime += dt;

    const interval = this._getInterval();
    if (this._elapsedTime >= interval) {
      this._track(e.time, interval);
    }
  }
}
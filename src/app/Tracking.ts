import { IPlayerApi, TimeUpdateEvent, SeekEvent, PlaybackStateChangeEvent, PlaybackState } from "./media/player/IPlayerApi";
import { EventHandler } from "./libs/events/EventHandler";
import { Stream } from "./media/video";
import { trackProgress } from "./media/crunchyroll";

export class VideoTracker {
  private _handler: EventHandler = new EventHandler(this);

  private _stream: Stream;
  private _api: IPlayerApi;
  private _elapsedTime: number = 0;
  private _lastTime: number = 0;

  private _intervals: number[];
  private _callCount: number = 1;

  constructor(stream: Stream, api: IPlayerApi) {
    this._stream = stream;
    this._api = api;
    this._intervals = stream.pingBackIntervals;

    this._handler
      .listen(api, 'playbackstatechange', this._onPlaybackStateChange, false)
      .listen(api, 'seek', this._onSeek, false)
      .listen(api, 'timeupdate', this._onTimeUpdate, false);
  }

  private _onPlaybackStateChange(e: PlaybackStateChangeEvent) {
    if (e.state !== PlaybackState.ENDED) return;

    const intervalIndex = Math.min(this._callCount - 1, this._intervals.length);
    const interval = this._intervals[intervalIndex];
    this._elapsedTime = 0;

    trackProgress(this._stream, this._api.getDuration(), interval/1000, this._callCount);

    this._callCount++;
  }
  
  private _onSeek(e: SeekEvent) {
    this._lastTime = e.time;
  }
  
  private _onTimeUpdate(e: TimeUpdateEvent) {
    const dt = Math.max(e.time - this._lastTime, 0);
    this._lastTime = e.time;

    this._elapsedTime += dt;

    const intervalIndex = Math.min(this._callCount - 1, this._intervals.length);
    const interval = this._intervals[intervalIndex];
    if (this._elapsedTime >= interval/1000) {
      this._elapsedTime = 0;

      trackProgress(this._stream, e.time, interval/1000, this._callCount);

      this._callCount++;
    }
  }
}
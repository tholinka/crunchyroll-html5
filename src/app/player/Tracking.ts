import { IMedia } from 'crunchyroll-lib/models/IMedia';
import { Disposable } from '../libs/disposable/Disposable';
import { EventHandler } from '../libs/events/EventHandler';
import { IPlayerApi, PlaybackState } from '../media/player/IPlayerApi';
import { PlaybackStateChangeEvent } from '../media/player/PlaybackStateChangeEvent';
import { SeekEvent } from '../media/player/SeekEvent';
import { TimeUpdateEvent } from '../media/player/TimeUpdateEvent';
import { trackProgress } from './crunchyroll';

export class VideoTracker extends Disposable {
  private _handler: EventHandler = new EventHandler(this);

  private _media: IMedia;
  private _api: IPlayerApi;
  private _elapsedTime: number = 0;
  private _lastTime: number = 0;

  private _intervals: number[];
  private _callCount: number = 0;

  private _affiliateCode?: string;

  constructor(media: IMedia, api: IPlayerApi, affiliateCode?: string) {
    super();

    this._media = media;
    this._api = api;
    this._intervals = media.getPingIntervals();
    this._affiliateCode = affiliateCode;

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

    trackProgress(
      this._media,
      time,
      interval,
      this._callCount,
      this._affiliateCode
    );
  }

  private _getInterval() {
    const intervalIndex = Math.min(this._callCount, this._intervals.length - 1);

    return this._intervals[intervalIndex] / 1000;
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

import { ISubtitleTrack } from "../subtitles/ISubtitleTrack";
import { EventTarget } from '../../libs/events/EventTarget';
import { Event } from '../../libs/events/Event';

export class PlaybackStateChangeEvent extends Event {
  constructor(public state: PlaybackState) {
    super('playbackstatechange');
  }
}

export class TimeUpdateEvent extends Event {
  constructor(public time: number) {
    super('timeupdate');
  }
}

export class DurationChangeEvent extends Event {
  constructor(public duration: number) {
    super('durationchange');
  }
}

export class VolumeChangeEvent extends Event {
  constructor(public volume: number) {
    super('volumechange');
  }
}

export enum PlaybackState {
  UNSTARTED,
  PAUSED,
  PLAYING,
  BUFFERING,
  ENDED
}

export interface IPlayerApi extends EventTarget {
  getPreferredPlaybackState(): PlaybackState;

  playVideo(): void;
  pauseVideo(): void;

  seekTo(time: number): void;
  seekBy(seconds: number): void;
  
  getDuration(): number;
  getCurrentTime(): number;

  setVolume(volume: number): void;
  getVolume(): number;

  enterFullscreen(): void;
  exitFullscreen(): void;
  toggleFullscreen(): void;
  isFullscreen(): boolean;

  getSubtitlesTracks(): ISubtitleTrack[];
  
  /**
   * Set the subtitle track by its index.
   * If set to -1 it will not display subtitles.
   * @param index the index of the subtitle track.
   */
  setSubtitleTrack(index: number): void;
}
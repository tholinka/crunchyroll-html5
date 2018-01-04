import { ISubtitleTrack } from "../subtitles/ISubtitleTrack";
import { EventTarget } from '../../libs/events/EventTarget';
import { Event } from '../../libs/events/Event';

export class PlaybackStateChangeEvent extends Event {
  constructor(public state: PlaybackState) {
    super('playbackstatechange');
  }
}

export class SeekEvent extends Event {
  constructor(public time: number) {
    super('seek');
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
  constructor(public volume: number, public muted: boolean) {
    super('volumechange');
  }
}

export class NextVideoEvent extends Event {
  constructor(public detail: IVideoDetail) {
    super('nextvideo');
  }
}

export enum PlaybackState {
  UNSTARTED,
  PAUSED,
  PLAYING,
  BUFFERING,
  ENDED
}

export interface IVideoDetail {
  title: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
}

export interface IPlayerApi extends EventTarget {
  setLarge(large: boolean): void;
  isLarge(): boolean;

  setForcePaused(force: boolean): void;
  getPlaybackState(): PlaybackState;
  getPreferredPlaybackState(): PlaybackState;

  playVideo(force?: boolean): void;
  pauseVideo(): void;

  seekTo(time: number): void;
  seekBy(seconds: number): void;
  
  getDuration(): number;
  getCurrentTime(): number;
  getBufferedTime(): number;

  setVolume(volume: number): void;
  getVolume(): number;
  mute(): void;
  unmute(): void;
  isMuted(): boolean;

  isFullscreenEnabled(): boolean;
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

  getNextVideoDetail(): IVideoDetail|undefined;
  setNextVideoDetail(nextVideo: IVideoDetail|undefined): void;
}
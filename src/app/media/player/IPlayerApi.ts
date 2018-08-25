import { EventTarget } from '../../libs/events/EventTarget';
import { ISubtitleTrack } from '../subtitles/ISubtitleTrack';

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
  playNextVideo(): void;

  getDuration(): number;
  getCurrentTime(): number;
  getBufferedTime(): number;

  setVolume(volume: number): void;
  getVolume(): number;
  mute(): void;
  unmute(): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;

  isFullscreenEnabled(): boolean;
  enterFullscreen(): void;
  exitFullscreen(): void;
  toggleFullscreen(): void;
  isFullscreen(): boolean;

  getSubtitlesTracks(): ISubtitleTrack[];
  getSubtitleTrack(): number;

  /**
   * Set the subtitle track by its index.
   * If set to -1 it will not display subtitles.
   * @param index the index of the subtitle track.
   */
  setSubtitleTrack(index: number): void;

  getNextVideoDetail(): IVideoDetail | undefined;
  setNextVideoDetail(nextVideo: IVideoDetail | undefined): void;

  isSettingsOpen(): boolean;
  openSettings(): void;
  closeSettings(): void;
}

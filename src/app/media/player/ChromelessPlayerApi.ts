import { IPlayerApi, PlaybackState, IVideoDetail } from './IPlayerApi';
import { EventTarget } from '../../libs/events/EventTarget';
import { ISubtitleTrack } from '../subtitles/ISubtitleTrack';
import { ChromelessPlayer } from './ChromelessPlayer';
import { isFullscreenEnabled } from '../../utils/fullscreen';

export class ChromelessPlayerApi extends EventTarget implements IPlayerApi {
  private _player: ChromelessPlayer|undefined;
  private _nextVideo: IVideoDetail|undefined = undefined;
  private _large: boolean = false;

  constructor(
    player?: ChromelessPlayer
  ) {
    super();

    this._player = player;
  }

  setLarge(large: boolean): void {
    this._large = large;

    this.dispatchEvent('sizechange');
  }

  isLarge(): boolean {
    return this._large;
  }
  
  getNextVideoDetail(): IVideoDetail|undefined {
    return this._nextVideo;
  }
  
  setNextVideoDetail(nextVideo: IVideoDetail|undefined): void {
    this._nextVideo = nextVideo;

    this.dispatchEvent('nextvideochange');
  }

  setChromelessPlayer(player: ChromelessPlayer) {
    this._player = player;
  }
  
  setForcePaused(force: boolean): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.setForcePaused(force);
  }

  getPlaybackState(): PlaybackState {
    if (!this._player) throw new Error("Not initialized");
    return this._player.getPlaybackState();
  }

  getPreferredPlaybackState(): PlaybackState {
    if (!this._player) throw new Error("Not initialized");
    return this._player.getPreferredPlaybackState();
  }

  playVideo(force: boolean = false): void {
    if (!this._player) throw new Error("Not initialized");
    if (force) {
      this._player.getVideoElement().play();
    } else {
      this._player.playVideo();
    }
  }

  pauseVideo(): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.pauseVideo();
  }

  seekTo(time: number): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.seekTo(time);
  }

  seekBy(seconds: number): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.seekBy(seconds);
  }

  getDuration(): number {
    if (!this._player) throw new Error("Not initialized");
    return this._player.getDuration();
  }

  getCurrentTime(): number {
    if (!this._player) throw new Error("Not initialized");
    return this._player.getCurrentTime();
  }

  getBufferedTime(): number {
    if (!this._player) throw new Error("Not initialized");
    return this._player.getBufferedTime();
  }

  setVolume(volume: number): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.setVolume(volume);
  }

  getVolume(): number {
    if (!this._player) throw new Error("Not initialized");
    return this._player.getVolume();
  }

  mute(): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.mute();
  }

  unmute(): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.unmute();
  }

  setMuted(muted: boolean): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.setMuted(muted);
  }

  isMuted(): boolean {
    if (!this._player) throw new Error("Not initialized");
    return this._player.isMuted();
  }

  isFullscreenEnabled(): boolean {
    return isFullscreenEnabled();
  }

  enterFullscreen(): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.enterFullscreen();
  }

  exitFullscreen(): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.exitFullscreen();
  }

  toggleFullscreen(): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.toggleFullscreen();
  }

  isFullscreen(): boolean {
    if (!this._player) throw new Error("Not initialized");
    return this._player.isFullscreen();
  }

  getSubtitlesTracks(): ISubtitleTrack[] {
    if (!this._player) throw new Error("Not initialized");
    return this._player.getSubtitleTracks();
  }

  setSubtitleTrack(index: number): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.setSubtitleTrack(index);
  }
}
import { IPlayerApi, PlaybackState } from "./IPlayerApi";
import { EventTarget } from '../../libs/events/EventTarget';
import { ISubtitleTrack } from "../subtitles/ISubtitleTrack";
import { ChromelessPlayer } from "./ChromelessPlayer";

export class ChromelessPlayerApi extends EventTarget implements IPlayerApi {
  private _player: ChromelessPlayer|undefined;

  constructor(
    player?: ChromelessPlayer
  ) {
    super();

    this._player = player;
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

  playVideo(): void {
    if (!this._player) throw new Error("Not initialized");
    this._player.playVideo();
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
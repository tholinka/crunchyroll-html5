import { EventTarget } from '../../libs/events/EventTarget';
import { isFullscreenEnabled } from '../../utils/fullscreen';
import { ISubtitleTrack } from '../subtitles/ISubtitleTrack';
import { ChromelessPlayer } from './ChromelessPlayer';
import { IPlayerApi, IVideoDetail, PlaybackState } from './IPlayerApi';
import { NextVideoEvent } from './NextVideoEvent';

export class ChromelessPlayerApi extends EventTarget implements IPlayerApi {
  private _player: ChromelessPlayer | undefined;
  private _nextVideo: IVideoDetail | undefined = undefined;
  private _large: boolean = false;
  private _settingsOpen: boolean = false;
  private _autoPlay: boolean = true;

  constructor(player?: ChromelessPlayer) {
    super();

    this._player = player;
  }

  public setLarge(large: boolean): void {
    this._large = large;

    this.dispatchEvent('sizechange');
  }

  public isLarge(): boolean {
    return this._large;
  }

  public getNextVideoDetail(): IVideoDetail | undefined {
    return this._nextVideo;
  }

  public setNextVideoDetail(nextVideo: IVideoDetail | undefined): void {
    this._nextVideo = nextVideo;

    this.dispatchEvent('nextvideochange');
  }

  public setChromelessPlayer(player: ChromelessPlayer) {
    this._player = player;
  }

  public setForcePaused(force: boolean): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.setForcePaused(force);
  }

  public getPlaybackState(): PlaybackState {
    if (!this._player) throw new Error('Not initialized');
    return this._player.getPlaybackState();
  }

  public getPreferredPlaybackState(): PlaybackState {
    if (!this._player) throw new Error('Not initialized');
    return this._player.getPreferredPlaybackState();
  }

  public playVideo(force: boolean = false): void {
    if (!this._player) throw new Error('Not initialized');
    if (force) {
      this._player.getVideoElement().play();
    } else {
      this._player.playVideo();
    }
  }

  public pauseVideo(): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.pauseVideo();
  }

  public seekTo(time: number): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.seekTo(time);
  }

  public seekBy(seconds: number): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.seekBy(seconds);
  }

  public playNextVideo(): void {
    const detail = this.getNextVideoDetail();
    if (!detail) return;
    const event = new NextVideoEvent(detail);
    this.dispatchEvent(event);
  }

  public getDuration(): number {
    if (!this._player) throw new Error('Not initialized');
    return this._player.getDuration();
  }

  public getCurrentTime(): number {
    if (!this._player) throw new Error('Not initialized');
    return this._player.getCurrentTime();
  }

  public getBufferedTime(): number {
    if (!this._player) throw new Error('Not initialized');
    return this._player.getBufferedTime();
  }

  public setVolume(volume: number): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.setVolume(volume);
  }

  public getVolume(): number {
    if (!this._player) throw new Error('Not initialized');
    return this._player.getVolume();
  }

  public mute(): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.mute();
  }

  public unmute(): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.unmute();
  }

  public setMuted(muted: boolean): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.setMuted(muted);
  }

  public isMuted(): boolean {
    if (!this._player) throw new Error('Not initialized');
    return this._player.isMuted();
  }

  public isFullscreenEnabled(): boolean {
    return isFullscreenEnabled();
  }

  public enterFullscreen(): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.enterFullscreen();
  }

  public exitFullscreen(): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.exitFullscreen();
  }

  public toggleFullscreen(): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.toggleFullscreen();
  }

  public isFullscreen(): boolean {
    if (!this._player) throw new Error('Not initialized');
    return this._player.isFullscreen();
  }

  public getSubtitlesTracks(): ISubtitleTrack[] {
    if (!this._player) throw new Error('Not initialized');
    return this._player.getSubtitleTracks();
  }

  public getSubtitleTrack(): number {
    if (!this._player) throw new Error('Not initialized');
    return this._player.getCurrentSubtitleTrack();
  }

  public setSubtitleTrack(index: number): void {
    if (!this._player) throw new Error('Not initialized');
    this._player.setSubtitleTrack(index);
  }

  public isSettingsOpen(): boolean {
    return this._settingsOpen;
  }

  public openSettings(): void {
    this._settingsOpen = true;
    this.dispatchEvent('settingsopen');
  }

  public closeSettings(): void {
    this._settingsOpen = false;
    this.dispatchEvent('settingsclose');
  }

  public isAutoPlay(): boolean {
    return this._autoPlay;
  }

  public setAutoPlay(autoPlay: boolean): void {
    this._autoPlay = autoPlay;
    this.dispatchEvent('autoplaychange');
  }
}

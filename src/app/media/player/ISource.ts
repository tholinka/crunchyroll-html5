import { IDisposable } from '../../libs/disposable/IDisposable';

export interface ISourceLevel {
  id: number;
  name: string;
  width: number;
  height: number;
  bitrate: number;
  codecs: string;
}

export interface ISourceAudioTrack {
  id: number;
  label: string;
  kind: string;
  language: string;
}

export interface ISource extends IDisposable {
  /**
   * Attaches the source to a video element.
   */
  attach(element: HTMLVideoElement): void;

  /**
   * Detach from the current attached video element.
   */
  detach(): void;

  /**
   * Set the audio track.
   *
   * @param id the audio track ID.
   */
  setAudioTrack(id: number): void;

  /**
   * Returns the current audio track ID.
   */
  getAudioTrack(): number;

  /**
   * Returns the audio tracks.
   */
  getAudioTracks(): ISourceAudioTrack[];

  /**
   * Set the current quality level.
   *
   * @param id the level ID.
   */
  setLevel(id: number): void;

  /**
   * Returns the current quality level ID.
   */
  getLevel(): number;

  /**
   * Returns the quality levels.
   */
  getLevels(): ISourceLevel[];
}

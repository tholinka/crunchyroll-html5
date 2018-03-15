import * as Hls from 'hls.js';
import { ISource, ISourceLevel, ISourceAudioTrack } from './ISource';
import { Disposable } from '../../libs/disposable/Disposable';
import { getPlaylistLoader } from '../../playlistLoader';

export class HlsSource extends Disposable implements ISource {
  private _hls: Hls;

  constructor(url: string) {
    super();

    this._hls = new Hls({
      loader: getPlaylistLoader()
    });

    this._hls.loadSource(url);
  }
  
  protected disposeInternal() {
    this._hls.destroy();
  }

  setAudioTrack(id: number): void {
    this._hls.audioTrack = id;
  }

  getAudioTrack(): number {
    return this._hls.audioTrack;
  }

  getAudioTracks(): ISourceAudioTrack[] {
    return this._hls.audioTracks.map((track, index) => {
      return {
        id: index,
        label: track.label,
        kind: track.kind,
        language: track.language
      };
    });
  }

  setLevel(id: number): void {
    this._hls.currentLevel = id;
  }

  getLevel(): number {
    return this._hls.currentLevel;
  }

  getLevels(): ISourceLevel[] {
    return this._hls.levels.map((level, index) => {
      return {
        id: index,
        name: level.name,
        width: level.width,
        height: level.height,
        bitrate: level.bitrate,
        codecs: level.codecs
      }
    });
  }

  attach(element: HTMLVideoElement) {
    this._hls.attachMedia(element);
  }

  detach() {
    this._hls.detachMedia();
  }
}
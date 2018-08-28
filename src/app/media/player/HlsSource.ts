import * as Hls from 'hls.js';
import { Disposable } from '../../libs/disposable/Disposable';
import { getPlaylistLoader } from '../../playlistLoader';
import { IPlayerApi } from './IPlayerApi';
import { ISource, ISourceAudioTrack, ISourceLevel } from './ISource';

export class HlsSource extends Disposable implements ISource {
  private _hls: Hls;

  constructor(api: IPlayerApi, url: string, quality?: string) {
    super();

    let config: Hls.Config | undefined;
    const loader = getPlaylistLoader();
    if (loader) {
      config = Object.assign({}, Hls.DefaultConfig, {
        loader
      });
    }

    this._hls = new Hls(config);

    this._hls.loadSource(url);

    this._hls.on(Hls.Events.LEVEL_SWITCHED, () =>
      api.dispatchEvent('qualitychange')
    );
    this._hls.on(Hls.Events.MANIFEST_PARSED, () => {
      for (let i = 0; i < this._hls.levels.length; i++) {
        if (this._hls.levels[i].height + 'p' === quality) {
          this._hls.currentLevel = i;
          break;
        }
      }
    });
  }

  public setAudioTrack(id: number): void {
    this._hls.audioTrack = id;
  }

  public getAudioTrack(): number {
    return this._hls.audioTrack;
  }

  public getAudioTracks(): ISourceAudioTrack[] {
    return this._hls.audioTracks.map((track, index) => {
      return {
        id: index,
        label: track.label,
        kind: track.kind,
        language: track.language
      };
    });
  }

  public setLevel(id: number): void {
    this._hls.currentLevel = id;
  }

  public getLevel(): number {
    return this._hls.currentLevel;
  }

  public getLevels(): ISourceLevel[] {
    if (!this._hls.levels) return [];

    return this._hls.levels.map((level, index) => {
      return {
        id: index,
        name: level.name,
        width: level.width,
        height: level.height,
        bitrate: level.bitrate,
        codecs: level.codecs
      };
    });
  }

  public attach(element: HTMLVideoElement) {
    this._hls.attachMedia(element);
  }

  public detach() {
    this._hls.detachMedia();
  }

  protected disposeInternal() {
    this._hls.destroy();
  }
}

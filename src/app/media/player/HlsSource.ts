import * as Hls from 'hls.js';
import { Disposable } from '../../libs/disposable/Disposable';
import { getPlaylistLoader } from '../../playlistLoader';
import { IPlayerApi } from './IPlayerApi';
import { ISource, ISourceAudioTrack, ISourceLevel } from './ISource';

export class HlsSource extends Disposable implements ISource {
  private _api: IPlayerApi;
  private _hls: Hls;
  private _url: string;
  private _quality: string | undefined;
  private _attachedElement?: HTMLVideoElement;

  constructor(api: IPlayerApi, url: string, quality?: string) {
    super();

    this._api = api;
    this._url = url;
    this._quality = quality;

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

  public getUrl(): string {
    return this._url;
  }

  public setUrl(url: string): void {
    if (this._url === url) return;
    this._url = url;

    // Destroy current hls media
    this._hls.detachMedia();
    this._hls.destroy();

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
      this._api.dispatchEvent('qualitychange')
    );
    this._hls.on(Hls.Events.MANIFEST_PARSED, () => {
      for (let i = 0; i < this._hls.levels.length; i++) {
        if (this._hls.levels[i].height + 'p' === this._quality) {
          this._hls.currentLevel = i;
          break;
        }
      }
    });

    if (this._attachedElement) {
      this._hls.attachMedia(this._attachedElement);
    }
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

    const level = this._getCurrentLevel();
    if (level) {
      this._quality = level.height + 'p';
    }
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
    this._attachedElement = element;
    this._hls.attachMedia(element);
  }

  public detach() {
    this._attachedElement = undefined;
    this._hls.detachMedia();
  }

  protected disposeInternal() {
    this._attachedElement = undefined;
    this._hls.destroy();
  }

  private _getCurrentLevel(): ISourceLevel | undefined {
    const level = this.getLevel();
    const levels = this.getLevels();

    if (level >= 0 && level < levels.length) {
      return levels[level];
    }
    return undefined;
  }
}

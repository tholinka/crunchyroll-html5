import { Formats } from 'crunchyroll-lib/media';
import { IMedia } from 'crunchyroll-lib/models/IMedia';
import { IQualityResolver } from '../models/IQualityResolver';
import { ChromelessPlayer } from './player/ChromelessPlayer';
import { HlsSource } from './player/HlsSource';
import { ISource } from './player/ISource';
import { Player } from './player/Player';

export class LegacyQualityResolver implements IQualityResolver {
  private _player?: ChromelessPlayer;
  private _availableQualities: Array<keyof Formats>;
  private _currentQuality?: keyof Formats;

  private _fetchQuality: (quality?: keyof Formats) => Promise<IMedia>;
  private _cache: { [key: string]: string } = {};

  constructor(
    availableQualities: Array<keyof Formats>,
    quality: keyof Formats | undefined,
    fetchQuality: (quality?: keyof Formats) => Promise<IMedia>
  ) {
    this._availableQualities = availableQualities;
    this._currentQuality = quality;
    this._fetchQuality = fetchQuality;
  }

  public getAvailableQualities(): Array<keyof Formats> {
    return this._availableQualities;
  }

  public async setQuality(quality?: keyof Formats): Promise<void> {
    if (!this._player) return;
    this._currentQuality = quality;

    if (this._player) {
      this._player.getApi().dispatchEvent('qualitychange');
    }

    const q = quality ? quality : '_';

    const currentTime = this._player.getCurrentTime();
    this._player.removeVideoSource();
    let hlsUrl: string | undefined;
    if (this._cache.hasOwnProperty(q)) {
      hlsUrl = this._cache[q];
    } else {
      const media = await this._fetchQuality(quality);

      hlsUrl = media.getStream().getFile();
      if (!hlsUrl) throw new Error('Unable to switch quality.');

      this._cache[q] = hlsUrl;
    }

    // Prevent race-condition issues
    if (this._currentQuality !== quality) return;

    this._player.setVideoSource(
      new HlsSource(this._player.getApi(), hlsUrl, quality),
      currentTime
    );
  }

  public getQuality(): keyof Formats | undefined {
    return this._currentQuality;
  }

  public bind(chromeless: ChromelessPlayer, source: ISource): void {
    this._player = chromeless;
  }
}

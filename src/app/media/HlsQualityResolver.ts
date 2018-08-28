import { Formats } from 'crunchyroll-lib/media';
import { IQualityResolver } from '../models/IQualityResolver';
import { ChromelessPlayer } from './player/ChromelessPlayer';
import { ISource } from './player/ISource';
import { Player } from './player/Player';

export class HlsQualityResolver implements IQualityResolver {
  private _player?: ChromelessPlayer;
  private _source?: ISource;

  public getAvailableQualities(): Array<keyof Formats> {
    if (!this._source) return [];

    const levels = this._source.getLevels().map(x => x.height + 'p') as Array<
      keyof Formats
    >;
    const qualities: Array<keyof Formats> = [];
    for (const level of levels) {
      if (qualities.indexOf(level) === -1) {
        qualities.push(level);
      }
    }

    return qualities;
  }

  public async setQuality(quality?: keyof Formats): Promise<void> {
    if (!this._source) return;

    if (quality) {
      const levels = this._source.getLevels();
      for (let i = 0; i < levels.length; i++) {
        if (levels[i].height + 'p' === quality) {
          this._source.setLevel(i);

          if (this._player) {
            this._player.getApi().dispatchEvent('qualitychange');
          }

          return;
        }
      }
    }

    // Set to auto if quality not found in the list.
    this._source.setLevel(-1);

    if (this._player) {
      this._player.getApi().dispatchEvent('qualitychange');
    }
  }

  public getQuality(): keyof Formats | undefined {
    if (!this._source) return undefined;

    const index = this._source.getLevel();
    const levels = this._source.getLevels();

    if (index < 0 || index >= levels.length) return undefined;

    const level = levels[index];

    return (level.height + 'p') as keyof Formats;
  }

  public bind(chromeless: ChromelessPlayer, source: ISource): void {
    this._player = chromeless;
    this._source = source;
  }
}

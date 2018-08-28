import { Formats } from 'crunchyroll-lib/media';
import { IQualityResolver } from '../models/IQualityResolver';
import { ChromelessPlayer } from './player/ChromelessPlayer';
import { ISource } from './player/ISource';

export class DummyQualityResolver implements IQualityResolver {
  public getAvailableQualities(): Array<keyof Formats> {
    return [];
  }

  public async setQuality(quality?: keyof Formats): Promise<void> {
    return;
  }

  public getQuality(): keyof Formats | undefined {
    return undefined;
  }

  public bind(chromeless: ChromelessPlayer, source: ISource): void {}
}

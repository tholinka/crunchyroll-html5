import { Formats } from 'crunchyroll-lib/media';
import { ChromelessPlayer } from '../media/player/ChromelessPlayer';
import { ISource } from '../media/player/ISource';
import { Player } from '../media/player/Player';

export interface IQualityResolver {
  getAvailableQualities(): Array<keyof Formats>;
  setQuality(quality?: keyof Formats): Promise<void>;
  getQuality(): keyof Formats | undefined;
  bind(chromeless: ChromelessPlayer, source: ISource): void;
}

export const IQualityResolverSymbol = Symbol.for('IQualityResolver');

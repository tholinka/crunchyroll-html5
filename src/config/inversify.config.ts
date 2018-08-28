import { Container, interfaces } from 'inversify';
import 'reflect-metadata';
import { DummyQualityResolver } from '../app/media/DummyQualityResolver';
import { IPlayerApi } from '../app/media/player/IPlayerApi';
import {
  IQualityResolver,
  IQualityResolverSymbol
} from '../app/models/IQualityResolver';
import { ISettingsFactory } from '../app/models/ISettingsFactory';
import { AutoPlaySettings } from '../app/settings/AutoPlaySettings';
import { PlaybackRateSettings } from '../app/settings/PlaybackRateSettings';
import { QualitySettings } from '../app/settings/QualitySettings';
import { SubtitleSettings } from '../app/settings/SubtitleSettings';
import { IStorage, IStorageSymbol } from '../app/storage/IStorage';
import { JsonStorage } from '../app/storage/JsonStorage';

export const ISettingsModuleFactorySymbol = Symbol.for(
  'ISettingsModuleFactory'
);

const container = new Container({
  autoBindInjectable: true
});

container.bind<IStorage>(IStorageSymbol).to(JsonStorage);

container
  .bind<IQualityResolver>(IQualityResolverSymbol)
  .toConstantValue(new DummyQualityResolver());

// Settings menu
container
  .bind<ISettingsFactory>(ISettingsModuleFactorySymbol)
  .toFactory(() => (api: IPlayerApi) => {
    return [
      new AutoPlaySettings(api),
      new PlaybackRateSettings(api),
      new SubtitleSettings(api),
      new QualitySettings(api, container)
    ];
  });

export default container;

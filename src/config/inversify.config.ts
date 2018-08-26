import { Container, interfaces } from 'inversify';
import 'reflect-metadata';
import { IPlayerApi } from '../app/media/player/IPlayerApi';
import { ISettingsFactory } from '../app/models/ISettingsFactory';
import { AutoPlaySettings } from '../app/settings/AutoPlaySettings';
import { PlaybackRateSettings } from '../app/settings/PlaybackRateSettings';
import { SubtitleSettings } from '../app/settings/SubtitleSettings';
import { IStorage, IStorageSymbol } from '../app/storage/IStorage';
import { JsonStorage } from '../app/storage/JsonStorage';

export const ISettingsModuleFactorySymbol = Symbol.for("ISettingsModuleFactory");

const container = new Container({
  autoBindInjectable: true
});

container.bind<IStorage>(IStorageSymbol).to(JsonStorage);

// Settings menu
container.bind<ISettingsFactory>(ISettingsModuleFactorySymbol).toFactory(context => (api: IPlayerApi) => {
  return [
    new AutoPlaySettings(api),
    new PlaybackRateSettings(api),
    new SubtitleSettings(api)
  ];
});

export default container;

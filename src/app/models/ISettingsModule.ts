import { IListenable } from '../libs/events/IListenable';
import { IMenuItem } from '../media/player/chrome/SettingsPopup';
import { IPlayerApi } from '../media/player/IPlayerApi';

export interface ISettingsModule extends IListenable {
  getMenuItem(): IMenuItem;

  setApi(api: IPlayerApi): void;
  getApi(): IPlayerApi;

  attachHandler(): void;
  detachHandler(): void;
}

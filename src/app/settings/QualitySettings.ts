import { Formats } from 'crunchyroll-lib/media';
import { Container } from 'inversify';
import { EventHandler } from '../libs/events/EventHandler';
import { EventTarget } from '../libs/events/EventTarget';
import {
  IMenuItem,
  IRadioMenuItem
} from '../media/player/chrome/SettingsPopup';
import { IPlayerApi } from '../media/player/IPlayerApi';
import {
  IQualityResolver,
  IQualityResolverSymbol
} from '../models/IQualityResolver';
import { ISettingsModule } from '../models/ISettingsModule';
import { setStoredQuality } from '../player/StandardPlayer';

export class QualitySettings extends EventTarget implements ISettingsModule {
  private _api: IPlayerApi;
  private _container: Container;
  private _handler: EventHandler = new EventHandler(this);

  constructor(api: IPlayerApi, container: Container) {
    super();
    this._api = api;
    this._container = container;
  }

  public getMenuItem(): IMenuItem {
    const resolver = this._container.get<IQualityResolver>(
      IQualityResolverSymbol
    );
    const currentQuality = resolver.getQuality();
    const qualities = resolver
      .getAvailableQualities()
      .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

    return {
      label: 'Quality',
      role: 'menuitem',
      content: currentQuality || '',
      items: qualities.map(
        (quality): IRadioMenuItem => ({
          label: quality,
          selected: currentQuality === quality,
          role: 'menuitemradio',
          onselect: () => {
            if (currentQuality !== quality) {
              this._setQuality(quality);
            }
          }
        })
      )
    };
  }

  public setApi(api: IPlayerApi): void {
    this._api = api;
  }

  public getApi(): IPlayerApi {
    return this._api;
  }

  public attachHandler(): void {
    this._handler.listen(this._api, 'qualitychange', () =>
      this.dispatchEvent('rebuild')
    );
  }

  public detachHandler(): void {
    this._handler.removeAll();
  }

  private async _setQuality(quality?: keyof Formats | 'auto'): Promise<void> {
    const resolver = this._container.get<IQualityResolver>(
      IQualityResolverSymbol
    );
    await resolver.setQuality(quality === 'auto' ? undefined : quality);
    await setStoredQuality(quality === 'auto' ? undefined : quality);

    this.dispatchEvent('navigateToCurrent');
  }
}

import { EventHandler } from '../libs/events/EventHandler';
import { EventTarget } from '../libs/events/EventTarget';
import { IMenuItem } from '../media/player/chrome/SettingsPopup';
import { IPlayerApi } from '../media/player/IPlayerApi';
import { ISettingsModule } from '../models/ISettingsModule';

export class AutoPlaySettings extends EventTarget implements ISettingsModule {
  private _api: IPlayerApi;
  private _handler = new EventHandler(this);
  constructor(api: IPlayerApi) {
    super();
    this._api = api;
  }

  public getMenuItem(): IMenuItem {
    const checked = this._api.isAutoPlay();

    return {
      label: 'Autoplay',
      role: 'menuitemcheckbox',
      checked,
      onchange: () => this._setAutoPlay(!checked)
    };
  }

  public setApi(api: IPlayerApi): void {
    this._api = api;
  }

  public getApi(): IPlayerApi {
    return this._api;
  }

  public attachHandler(): void {
    this._handler.listen(this._api, 'autoplaychange', () =>
      this.dispatchEvent('rebuild')
    );
  }

  public detachHandler(): void {
    this._handler.removeAll();
  }

  private _setAutoPlay(autoPlay: boolean): void {
    this._api.setAutoPlay(autoPlay);

    this.dispatchEvent('navigateToCurrent');
  }
}

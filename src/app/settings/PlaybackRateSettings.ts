import { EventHandler } from "../libs/events/EventHandler";
import { EventTarget } from "../libs/events/EventTarget";
import { IMenuItem, IRadioMenuItem } from "../media/player/chrome/SettingsPopup";
import { IPlayerApi } from "../media/player/IPlayerApi";
import { ISettingsModule } from "../models/ISettingsModule";

export class PlaybackRateSettings extends EventTarget implements ISettingsModule {
  private _api: IPlayerApi;
  private _handler: EventHandler = new EventHandler(this);
  
  constructor(api: IPlayerApi) {
    super();
    this._api = api;
  }

  public getMenuItem(): IMenuItem {
    const currentRate = this._api.getPlaybackRate();

    const rates = [
      0.25, 0.5, 0.75, 1, 1.25, 1.5, 2
    ];

    return {
      label: 'Speed',
      role: 'menuitem',
      content: currentRate === 1 ? "Normal" : currentRate.toString(),
      items: rates.map(
        (rate): IRadioMenuItem => ({
          label: rate === 1 ? "Normal" : rate.toString(),
          selected: currentRate === rate,
          role: 'menuitemradio',
          onselect: () => this._setPlaybackRate(rate)
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
    this._handler
      .listen(this._api, 'playbackratechange', () =>
        this.dispatchEvent('rebuild')
      );
  }

  public detachHandler(): void {
    this._handler.removeAll();
  }

  private _setPlaybackRate(rate: number) {
    this._api.setPlaybackRate(rate);

    this.dispatchEvent('navigateToCurrent');
  }
}
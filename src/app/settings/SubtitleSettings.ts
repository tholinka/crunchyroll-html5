import { EventHandler } from '../libs/events/EventHandler';
import { EventTarget } from '../libs/events/EventTarget';
import {
  IMenuItem,
  IRadioMenuItem
} from '../media/player/chrome/SettingsPopup';
import { IPlayerApi } from '../media/player/IPlayerApi';
import { ISettingsModule } from '../models/ISettingsModule';

export class SubtitleSettings extends EventTarget implements ISettingsModule {
  private _api: IPlayerApi;
  private _handler: EventHandler = new EventHandler(this);
  constructor(api: IPlayerApi) {
    super();
    this._api = api;
  }

  public getMenuItem(): IMenuItem {
    const tracks = this._api.getSubtitlesTracks();
    const currentTrack = this._api.getSubtitleTrack();
    const currentSelection =
      currentTrack < 0 ? 'Off' : tracks[currentTrack].label;

    return {
      label: 'Subtitles',
      role: 'menuitem',
      content: currentSelection,
      items: tracks.map(track => track.label).map(
        (track, index): IRadioMenuItem => ({
          label: track,
          selected: currentSelection === track,
          role: 'menuitemradio',
          onselect: () => this._setSubtitleTrack(index)
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
    this._handler.listen(this._api, 'subtitletrackchange', () =>
      this.dispatchEvent('rebuild')
    );
  }

  public detachHandler(): void {
    this._handler.removeAll();
  }

  private _setSubtitleTrack(track: number) {
    this._api.setSubtitleTrack(track);

    this.dispatchEvent('navigateToCurrent');
  }
}

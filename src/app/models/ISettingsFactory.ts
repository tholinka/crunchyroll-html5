import { IPlayerApi } from '../media/player/IPlayerApi';
import { ISettingsModule } from '../models/ISettingsModule';

export type ISettingsFactory = (api: IPlayerApi) => ISettingsModule[];
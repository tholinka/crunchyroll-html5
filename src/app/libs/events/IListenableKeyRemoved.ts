import { IListenableKey } from './IListenableKey';

export interface IListenableKeyRemoved extends IListenableKey {
  removed: boolean;
}

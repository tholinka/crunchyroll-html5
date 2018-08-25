import { IListenableKey } from './IListenableKey';

export interface IProxyFunction extends Function {
  src?: EventTarget;
  listener?: IListenableKey;
}

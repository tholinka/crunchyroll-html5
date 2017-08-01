import { IListener } from './ilistener';

export interface IEventTarget {
  listenByListener(listener: IListener): boolean;
  listen(type: string, fn, capture: boolean, handler?: any): IListener;
  unlistenByListener(listener: IListener): boolean;
  unlisten(type: string, fn: Function, capture: boolean, handler?: any): boolean;
  dispatchEvent(type: string, payload: any);
}
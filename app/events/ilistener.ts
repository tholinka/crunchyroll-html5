import { IEventTarget } from './ieventtarget';

export interface IListener {
  src: IEventTarget|EventTarget;
  type: string;
  fn: Function;
  capture: boolean;
  handler?: any;
  proxy: Function;
  removed: boolean;

  equals(listener: IListener): boolean;
  dispatchEvent(payload: any);
  listen();
  unlisten();
}
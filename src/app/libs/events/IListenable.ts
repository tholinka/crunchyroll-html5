import { Event, EventLike } from './Event';
import { IListenable } from './IListenable';
import { IListenableKey } from './IListenableKey';

export type ListneableFunction = (event: any) => any | void;

export interface IListenable {
  listen(
    type: string,
    listener: ListneableFunction,
    useCapture?: boolean,
    scope?: any
  ): IListenableKey;
  listenOnce(
    type: string,
    listener: ListneableFunction,
    useCapture?: boolean,
    scope?: any
  ): IListenableKey;
  unlisten(
    type: string,
    listener: ListneableFunction,
    useCapture?: boolean,
    scope?: any
  ): boolean;
  unlistenByKey(key: IListenableKey): boolean;
  dispatchEvent(event: EventLike): boolean;

  /**
   * Removes all the listeners and returns the amount removed.
   */
  removeAllListeners(type?: string): number;

  getParentEventTarget(): IListenable | undefined;
  fireListeners(type: string, capture: boolean, event: Event): boolean;
  getListeners(type: string, capture: boolean): IListenableKey[];
  getListener(
    type: string,
    listener: ListneableFunction,
    capture: boolean,
    scope?: any
  ): IListenableKey | undefined;
  hasListener(type?: string, capture?: boolean): boolean;
}

const IMPLEMENTED_BY_PROP: string =
  '_listenable_' + ((Math.random() * 1e6) | 0);

// tslint:disable-next-line:ban-types
export function addImplementation(cls: Function) {
  cls.prototype[IMPLEMENTED_BY_PROP] = true;
}

export function isImplementedBy(obj: any): boolean {
  return !!(obj && obj[IMPLEMENTED_BY_PROP]);
}

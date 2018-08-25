import { EventTarget as MyEventTarget } from './EventTarget';
import { IListenable, ListneableFunction } from './IListenable';
import { IProxyFunction } from './IProxyFunction';

export interface IListenableKey {
  /**
   * The source event target.
   */
  src: IListenable|MyEventTarget|EventTarget|undefined;

  /**
   * The event type the listener is listening to.
   */
  type: string;

  /**
   * The listener function.
   */
  listener: ListneableFunction;

  /**
   * Whether the listener works on capture phase.
   */
  capture: boolean;

  /**
   * The 'this' object for the listener function's scope.
   */
  handler?: any;

  /**
   * A globally unique number to identify the key.
   */
  key: number;

  /**
   * Wrapper for the listener that patches the event.
   */
  proxy: IProxyFunction|undefined;
}

let _counter: number = 0;
export function reserveKey() {
  return ++_counter;
}
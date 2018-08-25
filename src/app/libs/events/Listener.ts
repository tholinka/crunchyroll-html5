import { EventTarget as MyEventTarget } from './EventTarget';
import { addImplementation, IListenable, ListneableFunction } from './IListenable';
import { IListenableKey, reserveKey } from './IListenableKey';
import { IProxyFunction } from './IProxyFunction';

export class Listener implements IListenableKey {
  public key: number;

  /**
   * Whether the listener has been removed.
   */
  public removed: boolean = false;
  
  /**
   * Whether to remove the listener after it has been called.
   */
  public callOnce: boolean = false;

  constructor(
    public listener: ListneableFunction,
    public proxy: IProxyFunction|undefined,
    public src: IListenable|MyEventTarget|EventTarget|undefined,
    public type: string,
    public capture: boolean,
    public handler?: any
  ) {
    this.key = reserveKey();
  }

  /**
   * Marks this listener as removed. This also remove references held by
   * this listener object (such as listener and event source).
   */
  public markAsRemoved() {
    this.removed = true;
    this.proxy = undefined;
    this.handler = undefined;
  }
}

addImplementation(Listener);
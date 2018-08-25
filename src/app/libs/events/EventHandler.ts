import { Disposable } from '../disposable/Disposable';
import { Event as MyEvent} from './Event';
import { ListneableFunction } from './IListenable';
import { IListenableKey } from './IListenableKey';
import { getListener, listen, ListenableType, listenOnce, unlistenByKey } from './index';

export class EventHandler extends Disposable {
  private _scope: any;
  private _keys: {[key: string]: IListenableKey} = {};

  constructor(scope?: any) {
    super();

    this._scope = scope;
  }

  public listen(src: ListenableType, type: string, fn?: ListneableFunction, options: boolean|AddEventListenerOptions = false, scope?: any): EventHandler {
    const listenerObj = listen(src, type, fn || this.handleEvent, options, scope || this._scope || this);

    if (!listenerObj) {
      return this;
    }

    const key = listenerObj.key;
    this._keys[key] = listenerObj;
  
    return this;
  }

  public listenOnce(src: ListenableType, type: string, fn?: ListneableFunction, options: boolean|AddEventListenerOptions = false, scope?: any): EventHandler {
    const listenerObj = listenOnce(src, type, fn || this.handleEvent, options, scope || this._scope || this);
    
    if (!listenerObj) {
      return this;
    }

    const key = listenerObj.key;
    this._keys[key] = listenerObj;
  
    return this;
  }

  public unlisten(src: ListenableType, type: string, fn?: ListneableFunction, options: boolean|AddEventListenerOptions = false, scope?: any) {
    const capture = typeof options === 'object' ? !!options.capture : !!options;
    const listener = getListener(src, type, fn || this.handleEvent, capture,
        scope || this._scope || this);

    if (listener) {
      unlistenByKey(listener);
      delete this._keys[listener.key];
    }

    return this;
  }

  public removeAll() {
    for (const key in this._keys) {
      if (this._keys.hasOwnProperty(key)) {
        unlistenByKey(this._keys[key]);
      }
    }
  
    this._keys = {};
  }

  public getListenerCount(): number {
    let count = 0;
    for (const key in this._keys) {
      if (Object.prototype.hasOwnProperty.call(this._keys, key)) {
        count++;
      }
    }
    return count;
  }

  public handleEvent(event: MyEvent): boolean|void {
    throw new Error('EventHandler.handleEvent not implemented');
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.removeAll();
  }
}
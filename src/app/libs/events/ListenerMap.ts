import { IListenable, ListneableFunction } from './IListenable';
import { IListenableKey } from './IListenableKey';
import { Listener } from './Listener';

export class ListenerMap {
  private static _findListenerIndex(listenerArray: Listener[], listener: ListneableFunction, useCapture?: boolean, scope?: any) {
    for (let i = 0; i < listenerArray.length; ++i) {
      const listenerObj = listenerArray[i];
      if (!listenerObj.removed && listenerObj.listener === listener &&
          listenerObj.capture === !!useCapture &&
          listenerObj.handler === scope) {
        return i;
      }
    }
    return -1;
  }
  public listeners: { [key: string]: Listener[] } = {};
  private _typeCount: number = 0;

  constructor(
    public src: EventTarget|IListenable|undefined
  ) {}

  public getTypeCount(): number {
    return this._typeCount;
  }

  public getListenerCount(): number {
    let count = 0;
    for (const type in this.listeners) {
      if (this.listeners.hasOwnProperty(type)) {
        count += this.listeners[type].length;
      }
    }
    return count;
  }

  public add(type: string, listener: ListneableFunction, callOnce: boolean, useCapture?: boolean, scope?: any): IListenableKey {
    let listenerArray = this.listeners[type];
    if (!listenerArray) {
      listenerArray = this.listeners[type] = [];
      this._typeCount++;
    }
  
    let listenerObj;
    const index = ListenerMap._findListenerIndex(
        listenerArray, listener, useCapture, scope);
    if (index > -1) {
      listenerObj = listenerArray[index];
      if (!callOnce) {
        // Ensure that, if there is an existing callOnce listener, it is no
        // longer a callOnce listener.
        listenerObj.callOnce = false;
      }
    } else {
      listenerObj = new Listener(listener, undefined, this.src, type, !!useCapture, scope);
      listenerObj.callOnce = callOnce;
      listenerArray.push(listenerObj);
    }
    return listenerObj;
  }

  public remove(type: string, listener: ListneableFunction, useCapture?: boolean, scope?: any): boolean {
    if (!(type in this.listeners)) {
      return false;
    }
  
    const listenerArray = this.listeners[type];
    const index = ListenerMap._findListenerIndex(
        listenerArray, listener, useCapture, scope);
    if (index > -1) {
      const listenerObj = listenerArray[index];
      if (listenerObj instanceof Listener) {
        listenerObj.markAsRemoved();
      }
      listenerArray.splice(index, 1);
      if (listenerArray.length === 0) {
        delete this.listeners[type];
        this._typeCount--;
      }
      return true;
    }
    return false;
  }

  public removeByKey(listener: IListenableKey): boolean {
    const type = listener.type;
    if (!(type in this.listeners)) {
      return false;
    }

    const index = (this.listeners[type] as IListenableKey[]).indexOf(listener);
    if (index !== -1) {
      this.listeners[type].splice(index, 1);
      if (listener instanceof Listener) {
        listener.markAsRemoved();
      }
      if (this.listeners[type].length === 0) {
        delete this.listeners[type];
        this._typeCount--;
      }
    }
    return index !== -1;
  }

  public removeAll(type?: string): number {
    let count = 0;
    for (const _type in this.listeners) {
      if (!type || _type === type) {
        const listenerArray = this.listeners[_type];
        for (const listener of listenerArray) {
          ++count;
          listener.markAsRemoved();
        }
        delete this.listeners[_type];
        this._typeCount--;
      }
    }
    return count;
  }

  public getListeners(type: string, capture: boolean): IListenableKey[] {
    const listenerArray = this.listeners[type.toString()];
    const rv: IListenableKey[] = [];
    if (listenerArray) {
      for (const listener of listenerArray) {
        if (listener.capture === capture) {
          rv.push(listener);
        }
      }
    }
    return rv;
  }

  public getListener(type: string, listener: ListneableFunction, capture: boolean, scope?: any): IListenableKey|undefined {
    const listenerArray = this.listeners[type];
    let i = -1;
    if (listenerArray) {
      i = ListenerMap._findListenerIndex(
          listenerArray, listener, capture, scope);
    }
    return i > -1 ? listenerArray[i] : undefined;
  }

  public hasListener(type?: string, capture?: boolean): boolean {
    const hasType = type !== undefined;
    const typeStr = hasType ? type : '';
    const hasCapture = capture !== undefined;

    for (const x in this.listeners) {
      if (this.listeners.hasOwnProperty(x)) {
        const listenerArray = this.listeners[x];
        for (const listener of listenerArray) {
          if ((!hasType || listener.type === typeStr) &&
              (!hasCapture || listener.capture === capture)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
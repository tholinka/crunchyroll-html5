import { Listener } from './listener';
import { IListener } from './ilistener';
import { Disposable } from '../disposable';
import { IEventTarget } from './ieventtarget';

export class EventTarget extends Disposable implements IEventTarget {
  private _listeners: IListener[] = [];

  constructor() {
    super();
  }

  protected disposeInternal() {
    super.disposeInternal();

    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i].unlisten();
    }
    this._listeners = null;
  }

  listenByListener(listener: IListener): boolean {
    for (let i = 0; i < this._listeners.length; i++) {
      if (listener.equals(this._listeners[i]))
        return false;
    }
    this._listeners.push(listener);
  }

  listen(type: string, fn, capture: boolean = false, handler?: any): IListener {
    var listener = new Listener(this, type, fn, capture, handler);
    for (let i = 0; i < this._listeners.length; i++) {
      if (listener.equals(this._listeners[i]))
        return this._listeners[i];
    }
    this._listeners.push(listener);

    return listener;
  }

  unlistenByListener(listener: IListener): boolean {
    const index = this._listeners.indexOf(listener);
    if (index === -1) return false;
    this._listeners.splice(index, 1);
  }

  unlisten(type: string, fn: Function, capture: boolean = false, handler?: any): boolean {
    var listener = new Listener(this, type, fn, capture, handler);
    for (let i = 0; i < this._listeners.length; i++) {
      if (listener.equals(this._listeners[i]))
        return this.unlistenByListener(this._listeners[i]);
    }
    return false;
  }
  
  dispatchEvent(type: string, payload: any) {
    for (let i = 0; i < this._listeners.length; i++) {
      let listener = this._listeners[i];
      if (listener.type !== type) continue;
      listener.proxy(payload);
    }
  }
}
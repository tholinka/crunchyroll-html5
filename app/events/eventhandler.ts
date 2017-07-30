import { Disposable } from '../disposable';
import { Listener } from './listener';
import { EventTarget as LEventTarget } from './eventtarget';

export class EventHandler extends Disposable {
  private _listeners: Listener[] = [];
  private handler: any;

  constructor(handler?: any) {
    super();

    this.handler = handler;
  }

  protected disposeInternal() {
    super.disposeInternal();

    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i].unlisten();
    }
    this._listeners = null;
  }

  clear() {
    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i].unlisten();
    }
    this._listeners = [];
  }

  listen(src: EventTarget|LEventTarget, type: string, fn, capture: boolean = false, handler?: any): EventHandler {
    var listener = new Listener(src, type, fn, capture, handler || this.handler);
    const index = this._listeners.indexOf(listener);
    if (index !== -1) return this;

    listener.listen();
    this._listeners.push(listener);

    return this;
  }

  unlistenByListener(listener: Listener): EventHandler {
    const index = this._listeners.indexOf(listener);
    if (index === -1) return this;
    listener.unlisten();
    this._listeners.splice(index, 1);
    return this;
  }

  unlisten(src: EventTarget|LEventTarget, type: string, fn: Function, capture: boolean = false, handler?: any): EventHandler {
    var listener = new Listener(src, type, fn, capture, handler || this.handler);
    for (let i = 0; i < this._listeners.length; i++) {
      if (listener.equals(this._listeners[i])) {
        return this.unlistenByListener(this._listeners[i]);
      }
    }
    return this;
  }
}
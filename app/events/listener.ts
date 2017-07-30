import { IEventTarget } from './ieventtarget';
import { IListener } from './ilistener';

export class Listener implements IListener {
  public proxy: Function;
  public removed: boolean = true;

  constructor(
    public src: IEventTarget|EventTarget,
    public type: string,
    public fn: Function,
    public capture: boolean,
    public handler?: any
  ) {
    this.proxy = fn.bind(handler);
  }

  equals(listener: IListener): boolean {
    return listener.src === this.src
      && listener.type === this.type
      && listener.fn === this.fn
      && listener.capture === this.capture
      && listener.handler === this.handler;
  }

  dispatchEvent(payload: any) {
    this.proxy(payload);
  }

  listen() {
    this.removed = false;
    if (this.src instanceof EventTarget) {
      this.src.addEventListener(this.type, <EventListener> this.proxy, this.capture);
    }
  }

  unlisten() {
    this.removed = true;
    if (this.src instanceof EventTarget) {
      this.src.removeEventListener(this.type, <EventListener> this.proxy, this.capture);
    }
  }
}
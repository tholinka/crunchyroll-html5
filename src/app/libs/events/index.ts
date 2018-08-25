import { BrowserEvent } from './BrowserEvent';
import { PASSIVE_EVENTS } from './BrowserFeature';
import { EventLike } from './Event';
import {
  IListenable,
  isImplementedBy as isImplementedByListenable,
  ListneableFunction
} from './IListenable';
import { IListenableKey } from './IListenableKey';
import { IListenableKeyRemoved } from './IListenableKeyRemoved';
import { IProxyFunction } from './IProxyFunction';
import { Listener } from './Listener';
import { ListenerMap } from './ListenerMap';

const _LISTENER_MAP_PROP: string =
  '_listenerMap_' + ((Math.random() * 1e6) | 0);
const _handleBrowserEvent = (
  src: EventTarget | undefined,
  listener: Listener | undefined,
  event?: Event
): any => {
  if (!listener) return;

  if (listener.removed) {
    return true;
  }
  return fireListener(listener, new BrowserEvent(event, src));
};

let _listenerCountEstimate: number = 0;

function _listen(
  src: EventTarget,
  type: string,
  listener: ListneableFunction,
  callOnce: boolean = false,
  options: boolean | AddEventListenerOptions = false,
  scope?: any
): IListenableKey {
  let listenerMap: ListenerMap | undefined = _getListenerMap(src);
  if (!listenerMap) {
    (src as any)[_LISTENER_MAP_PROP] = listenerMap = new ListenerMap(src);
  }
  const capture: boolean =
    typeof options === 'object' ? !!options.capture : !!options;

  const listenerObj = listenerMap.add(type, listener, callOnce, capture, scope);
  if (listenerObj.proxy) {
    return listenerObj;
  }

  const proxy = getProxy();
  listenerObj.proxy = proxy;

  proxy.src = src;
  proxy.listener = listenerObj;

  // Don't pass an object as `capture` if the browser doesn't support that.
  if (!PASSIVE_EVENTS) {
    options = capture;
  }
  src.addEventListener(type.toString(), proxy as EventListener, options);

  _listenerCountEstimate++;
  return listenerObj;
}

function _getListenerMap(src: EventTarget): ListenerMap | undefined {
  const listenerMap = (src as any)[_LISTENER_MAP_PROP];
  return listenerMap instanceof ListenerMap ? listenerMap : undefined;
}

export function fireListener(listener: Listener, eventObject: object): any {
  const listenerFn = listener.listener;
  const listenerHandler = listener.handler || listener.src;

  if (listener.callOnce) {
    unlistenByKey(listener);
  }
  return listenerFn.call(listenerHandler, eventObject);
}

export function getProxy(): IProxyFunction {
  const proxyCallbackFunction = _handleBrowserEvent;
  // Use a local let f to prevent one allocation.
  const f: IProxyFunction = (eventObject: Event) =>
    proxyCallbackFunction.call(null, f.src, f.listener, eventObject);
  return f;
}

export function listen(
  src: ListenableType,
  type: string,
  listener: ListneableFunction,
  options: boolean | AddEventListenerOptions = false,
  scope?: any
): IListenableKey {
  if (isImplementedByListenable(src)) {
    const capture: boolean =
      typeof options === 'object' ? !!options.capture : !!options;
    return (src as IListenable).listen(type, listener, capture, scope);
  } else {
    return _listen(src as EventTarget, type, listener, false, options, scope);
  }
}

export function listenOnce(
  src: ListenableType,
  type: string,
  listener: ListneableFunction,
  options: boolean | AddEventListenerOptions = false,
  scope?: any
): IListenableKey {
  if (isImplementedByListenable(src)) {
    const capture: boolean =
      typeof options === 'object' ? !!options.capture : !!options;
    return (src as IListenable).listenOnce(type, listener, capture, scope);
  } else {
    return _listen(src as EventTarget, type, listener, true, options, scope);
  }
}

export function unlisten(
  src: ListenableType,
  type: string,
  listener: ListneableFunction,
  options: boolean | AddEventListenerOptions = false,
  scope?: any
): boolean {
  const capture: boolean =
    typeof options === 'object' ? !!options.capture : !!options;

  if (isImplementedByListenable(src)) {
    return (src as IListenable).unlisten(type, listener, capture, scope);
  }

  const listenerMap = _getListenerMap(src as EventTarget);
  if (listenerMap) {
    const listenerObj = listenerMap.getListener(type, listener, capture, scope);
    if (listenerObj) {
      return unlistenByKey(listenerObj);
    }
  }

  return false;
}

export function unlistenByKey(listener: IListenableKey): boolean {
  if (!listener || (listener as IListenableKeyRemoved).removed) {
    return false;
  }

  const src = listener.src;
  if (isImplementedByListenable(src)) {
    return (src as IListenable).unlistenByKey(listener);
  }

  const type = listener.type;
  const proxy = listener.proxy as EventListener;

  const domSrc = src as EventTarget;

  domSrc.removeEventListener(type, proxy, listener.capture);
  _listenerCountEstimate--;

  const listenerMap = _getListenerMap(domSrc);
  if (listenerMap) {
    listenerMap.removeByKey(listener);
    if (listenerMap.getTypeCount() === 0) {
      listenerMap.src = undefined;
      (src as any)[_LISTENER_MAP_PROP] = undefined;
    }
  } else {
    (listener as Listener).markAsRemoved();
  }

  return true;
}

export function removeAll(src?: ListenableType, type?: string): number {
  if (!src) return 0;
  if (isImplementedByListenable(src)) {
    return (src as IListenable).removeAllListeners(type);
  }

  const listenerMap = _getListenerMap(src as EventTarget);
  if (!listenerMap) {
    return 0;
  }

  let count = 0;
  const typeStr = type;
  for (const x in listenerMap.listeners) {
    if (!typeStr || x === typeStr) {
      // Clone so that we don't need to worry about unlistenByKey
      // changing the content of the ListenerMap.
      const listeners = listenerMap.listeners[x].concat();
      for (const listener of listeners) {
        if (unlistenByKey(listener)) {
          ++count;
        }
      }
    }
  }
  return count;
}

export function getListeners(
  src: ListenableType,
  type: string,
  capture: boolean
): IListenableKey[] {
  if (isImplementedByListenable(src)) {
    return (src as IListenable).getListeners(type, capture);
  } else {
    const listenerMap = _getListenerMap(src as EventTarget);
    return listenerMap ? listenerMap.getListeners(type, capture) : [];
  }
}

export function getListener(
  src: ListenableType,
  type: string,
  listener: ListneableFunction,
  capture: boolean = false,
  scope?: any
): IListenableKey | undefined {
  if (isImplementedByListenable(src)) {
    return (src as IListenable).getListener(type, listener, capture, scope);
  }

  const listenerMap = _getListenerMap(src as EventTarget);
  if (listenerMap) {
    return listenerMap.getListener(type, listener, capture, scope);
  }
  return undefined;
}

export function hasListener(
  src: ListenableType,
  type?: string,
  capture?: boolean
): boolean {
  if (isImplementedByListenable(src)) {
    return (src as IListenable).hasListener(type || '', capture);
  }

  const listenerMap = _getListenerMap(src as EventTarget);
  return !!listenerMap && listenerMap.hasListener(type, capture);
}

export function dispatchEvent(src: IListenable, event: EventLike) {
  return src.dispatchEvent(event);
}

export function getTotalListenerCount(): number {
  return _listenerCountEstimate;
}

export type ListenableType = EventTarget | IListenable;
export type Key = number | IListenableKey;

import * as _ from 'lodash';
import { Disposable } from '../disposable/Disposable';
import { Event, EventLike } from './Event';
import {
  addImplementation,
  IListenable,
  ListneableFunction
} from './IListenable';
import { IListenableKey } from './IListenableKey';
import { ListenerMap } from './ListenerMap';

const MAX_ANCESTORS = 1000;

export class EventTarget extends Disposable implements IListenable {
  private _eventTargetListeners: ListenerMap = new ListenerMap(this);
  private _parentEventTarget?: EventTarget;
  private _actualEventTarget: EventTarget = this;

  constructor() {
    super();
  }

  public setParentEventTarget(parent?: EventTarget) {
    this._parentEventTarget = parent;
  }

  public getParentEventTarget(): EventTarget | undefined {
    return this._parentEventTarget;
  }

  public dispatchEvent(event: EventLike): boolean {
    let ancestorsTree: EventTarget[] | undefined;
    let ancestor = this.getParentEventTarget();
    if (ancestor) {
      ancestorsTree = [];
      let ancestorCount = 1;
      for (; ancestor; ancestor = ancestor.getParentEventTarget()) {
        ancestorsTree.push(ancestor);
        if (++ancestorCount >= MAX_ANCESTORS) throw new Error('Infinite loop');
      }
    }

    return this._dispatchEventInternal(
      this._actualEventTarget,
      event,
      ancestorsTree
    );
  }

  /** @deprecated */
  public addEventListener(
    type: string,
    listener: ListneableFunction,
    useCapture?: boolean,
    scope?: any
  ): IListenableKey {
    return this.listen(type, listener, useCapture, scope);
  }

  /** @deprecated */
  public removeEventListener(
    type: string,
    listener: ListneableFunction,
    useCapture?: boolean,
    scope?: any
  ): boolean {
    return this.unlisten(type, listener, useCapture, scope);
  }

  public listen(
    type: string,
    listener: ListneableFunction,
    useCapture?: boolean,
    scope?: any
  ): IListenableKey {
    return this._eventTargetListeners.add(
      type,
      listener,
      false,
      useCapture,
      scope
    );
  }

  public listenOnce(
    type: string,
    listener: ListneableFunction,
    useCapture?: boolean,
    scope?: any
  ): IListenableKey {
    return this._eventTargetListeners.add(
      type,
      listener,
      true,
      useCapture,
      scope
    );
  }

  public unlisten(
    type: string,
    listener: ListneableFunction,
    useCapture?: boolean,
    scope?: any
  ): boolean {
    return this._eventTargetListeners.remove(type, listener, useCapture, scope);
  }

  public unlistenByKey(key: IListenableKey): boolean {
    return this._eventTargetListeners.removeByKey(key);
  }

  public removeAllListeners(): number {
    if (!this._eventTargetListeners) {
      return 0;
    }

    return this._eventTargetListeners.removeAll();
  }

  public fireListeners(type: string, capture: boolean, event: Event): boolean {
    let listenerArray = this._eventTargetListeners.listeners[String(type)];
    if (!listenerArray) {
      return true;
    }
    listenerArray = listenerArray.concat();

    let rv = true;
    for (const listener of listenerArray) {
      // We might not have a listener if the listener was removed.
      if (listener && !listener.removed && listener.capture === capture) {
        const listenerFn = listener.listener;
        const listenerHandler = listener.handler || listener.src;

        if (listener.callOnce) {
          this.unlistenByKey(listener);
        }
        rv = listenerFn.call(listenerHandler, event) !== false && rv;
      }
    }

    return rv && !event.isReturnValue();
  }

  public getListeners(type: string, capture: boolean): IListenableKey[] {
    return this._eventTargetListeners.getListeners(type, capture);
  }

  public getListener(
    type: string,
    listener: ListneableFunction,
    capture: boolean,
    scope?: any
  ): IListenableKey | undefined {
    return this._eventTargetListeners.getListener(
      type,
      listener,
      capture,
      scope
    );
  }

  public hasListener(type?: string, capture?: boolean): boolean {
    return this._eventTargetListeners.hasListener(type, capture);
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.removeAllListeners();
  }

  private _dispatchEventInternal(
    target: EventTarget,
    eventLike: EventLike,
    ancestorsTree?: EventTarget[]
  ) {
    let event: Event;
    if (typeof eventLike === 'string') {
      event = new Event(eventLike, target);
    } else if (!(eventLike instanceof Event)) {
      event = _.extend(
        new Event((eventLike as { type: string }).type, target),
        eventLike
      );
    } else {
      event = eventLike;
      event.target = eventLike.target || target;
    }

    const type = event.type;
    let returnValue = true;

    if (ancestorsTree) {
      for (
        let i = ancestorsTree.length - 1;
        !event.isPropagationStopped() && i >= 0;
        i--
      ) {
        const currentTarget = (event.currentTarget = ancestorsTree[i]);
        returnValue =
          currentTarget.fireListeners(type, true, event) && returnValue;
      }
    }

    // Executes capture and bubble listeners on the target.
    if (!event.isPropagationStopped()) {
      const currentTarget = (event.currentTarget = target);
      returnValue =
        currentTarget.fireListeners(type, true, event) && returnValue;
      if (!event.isPropagationStopped()) {
        returnValue =
          currentTarget.fireListeners(type, false, event) && returnValue;
      }
    }

    // Executes all bubble listeners on the ancestors, if any.
    if (ancestorsTree) {
      for (
        let i = 0;
        !event.isPropagationStopped() && i < ancestorsTree.length;
        i++
      ) {
        const currentTarget = (event.currentTarget = ancestorsTree[i]);
        returnValue =
          currentTarget.fireListeners(type, false, event) && returnValue;
      }
    }

    return returnValue;
  }
}

addImplementation(EventTarget);

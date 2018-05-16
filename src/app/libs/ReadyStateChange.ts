import { EventTarget } from "./events/EventTarget";
import { Event } from "./events/Event";

export enum ReadyState {
  Loading,
  Interactive,
  Complete
}

/**
 * Convert a DocumentReadyState to ReadyState.
 * @param readyState the document ready state
 */
const toReadyState = (readyState: DocumentReadyState) => {
  switch (readyState) {
    case "loading":
      return ReadyState.Loading;
    case "interactive":
      return ReadyState.Interactive;
    case "complete":
      return ReadyState.Complete;
  }
};

export class ReadyStateChange extends EventTarget {
  private _document: Document;
  private _currentReadyState?: ReadyState;

  constructor(document: Document) {
    super();

    this._document = document;
  }

  getCurrentReadyState(): ReadyState|undefined {
    return this._currentReadyState;
  }

  tick() {
    const readyState = toReadyState(this._document.readyState);
    const currentReadyStatePriority
      = this._currentReadyState === undefined
      ? -1
      : this._currentReadyState as number;

    for (let i = currentReadyStatePriority + 1; i <= readyState; i++) {
      this._currentReadyState = i;
      this.dispatchEvent(new ReadyStateChangeEvent(i, this));
    }
  }
}

export class ReadyStateChangeEvent extends Event {
  public readyState: ReadyState;

  constructor(readyState: ReadyState, target?: Object) {
    super("readystatechange", target);

    this.readyState = readyState;
  }
}
import { EventTarget } from './events/EventTarget';
import { ReadyState } from './ReadyState';
import { ReadyStateChangeEvent } from './ReadyStateChangeEvent';

/**
 * Convert a DocumentReadyState to ReadyState.
 * @param readyState the document ready state
 */
const toReadyState = (readyState: DocumentReadyState) => {
  switch (readyState) {
    case 'loading':
      return ReadyState.Loading;
    case 'interactive':
      return ReadyState.Interactive;
    case 'complete':
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

  public getCurrentReadyState(): ReadyState | undefined {
    return this._currentReadyState;
  }

  public tick() {
    const readyState = toReadyState(this._document.readyState);
    const currentReadyStatePriority =
      this._currentReadyState === undefined
        ? -1
        : (this._currentReadyState as number);

    for (let i = currentReadyStatePriority + 1; i <= readyState; i++) {
      this._currentReadyState = i;
      this.dispatchEvent(new ReadyStateChangeEvent(i, this));
    }
  }
}

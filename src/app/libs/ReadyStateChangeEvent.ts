import { Event } from './events/Event';
import { ReadyState } from './ReadyState';

export class ReadyStateChangeEvent extends Event {
  public readyState: ReadyState;

  constructor(readyState: ReadyState, target?: object) {
    super('readystatechange', target);

    this.readyState = readyState;
  }
}

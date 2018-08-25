import { Event } from '../libs/events/Event';
import { IEventData } from './libass';
export class CustomEvent extends Event {
  constructor(public data: IEventData) {
    super('custom');
  }
}

import { Event } from '../../libs/events/Event';
export class DurationChangeEvent extends Event {
  constructor(public duration: number) {
    super('durationchange');
  }
}
import { Event } from '../../libs/events/Event';
export class SeekEvent extends Event {
  constructor(public time: number) {
    super('seek');
  }
}
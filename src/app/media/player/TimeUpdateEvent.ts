import { Event } from '../../libs/events/Event';
export class TimeUpdateEvent extends Event {
  constructor(public time: number) {
    super('timeupdate');
  }
}
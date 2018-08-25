import { Event } from '../../libs/events/Event';
export class VolumeChangeEvent extends Event {
  constructor(public volume: number, public muted: boolean) {
    super('volumechange');
  }
}

import { Event } from '../../libs/events/Event';
export class PlaybackRateChangeEvent extends Event {
  constructor(public time: number) {
    super('playbackratechange');
  }
}

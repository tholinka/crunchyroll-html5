import { Event } from '../../libs/events/Event';
import { IVideoDetail } from './IPlayerApi';
export class NextVideoEvent extends Event {
  constructor(public detail: IVideoDetail) {
    super('nextvideo');
  }
}
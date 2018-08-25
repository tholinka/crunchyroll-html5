import { Event } from '../../libs/events/Event';
import { PlaybackState } from './IPlayerApi';
export class PlaybackStateChangeEvent extends Event {
  constructor(public state: PlaybackState) {
    super('playbackstatechange');
  }
}
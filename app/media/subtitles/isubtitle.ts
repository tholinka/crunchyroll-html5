import { Subtitle } from '../video';
import { EventTarget } from '../../libs/events/EventTarget';

export interface ISubtitleRect {
  width: number;
  height: number;
  x: number;
  y: number;
}

export abstract class SubtitleEngine extends EventTarget {
  abstract attach(element: HTMLVideoElement): void;
  abstract detach(): void;
  abstract getElement(): Element;
  abstract setTrack(subtitle: Subtitle): void;
  abstract getTrack(): Subtitle;
  abstract getRect(): ISubtitleRect;
  abstract resize(): void;
}
import { Subtitle } from '../../video';
import { EventTarget } from '../../../events/eventtarget';

export interface ISubtitleRect {
  width: number;
  height: number;
  x: number;
  y: number;
}

export abstract class SubtitleEngine extends EventTarget {
  abstract attach(element: HTMLVideoElement);
  abstract detach();
  abstract getElement(): Element;
  abstract setSubtitle(subtitle: Subtitle);
  abstract getSubtitle(): Subtitle;
  abstract getRect(): ISubtitleRect;
  abstract resize();
}
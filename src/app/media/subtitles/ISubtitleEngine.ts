import { EventTarget } from '../../libs/events/EventTarget';
import { ISubtitleTrack } from './ISubtitleTrack';

export interface ISubtitleRect {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface ISubtitleEngine extends EventTarget {
  attach(element: HTMLVideoElement): void;
  detach(): void;
  getElement(): Element;
  setTrack(content: string): void;
  getRect(): ISubtitleRect;
  resize(): void;
}
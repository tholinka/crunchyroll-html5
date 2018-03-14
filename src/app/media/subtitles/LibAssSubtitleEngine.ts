import { LibAss } from '../libass';
import { ISubtitleEngine, ISubtitleRect } from './ISubtitleEngine';
import { EventHandler } from '../../libs/events/EventHandler';
import { ISubtitleTrack } from './ISubtitleTrack';
import { EventTarget } from '../../libs/events/EventTarget';
import { fonts } from '../../SubtitleEngineLoader';

export class LibAssSubtitleEngine extends EventTarget implements ISubtitleEngine {
  private libass = new LibAss(fonts);
  private track: ISubtitleTrack;
  private handler: EventHandler = new EventHandler(this);

  private initialized: boolean = false;

  constructor() {
    super();

    this.handler
      .listen(this.libass, 'ready', this.onReady)
      .listen(this.libass, 'resize', this.onResize);
  }

  private onReady() {
    this.dispatchEvent('ready');
  }

  private onResize() {
    this.dispatchEvent('resize');
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.handler.dispose();
  }

  attach(element: HTMLVideoElement) {
    this.libass.attach(element);
  }

  detach() {
    this.libass.detach();
  }

  getElement(): Element {
    return this.libass.getCanvas();
  }

  setTrack(content: string) {
    if (this.initialized) {
      this.libass.setTrack(content);
    } else {
      this.initialized = true;
      this.libass.init(content);
    }
  }

  getRect(): ISubtitleRect {
    var rect = this.libass.getVideoRect();

    return {
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y
    };
  }

  resize() {
    this.libass.resize();
  }
}
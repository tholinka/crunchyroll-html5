import { LibAss } from '../libass';
import { SubtitleEngine, ISubtitleRect } from './isubtitle';
import { Subtitle } from '../video';
import { EventHandler } from '../../libs/events/EventHandler';

export class LibAssSubtitle extends SubtitleEngine {
  private libass = new LibAss();
  private subtitle: Subtitle;
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

  setTrack(subtitle: Subtitle) {
    this.subtitle = subtitle;

    let ass = subtitle.toAss();
    if (this.initialized) {
      this.libass.setTrack(ass);
    } else {
      this.initialized = true;
      this.libass.init(ass);
    }
  }

  getTrack(): Subtitle {
    return this.subtitle;
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
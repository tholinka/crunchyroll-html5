import { LibAss } from '../../libass';
import { SubtitleEngine, ISubtitleRect } from './isubtitle';
import { Subtitle } from '../../video';
import { EventHandler } from '../../../events/eventhandler';

export class LibAssSubtitle extends SubtitleEngine {
  private libass = new LibAss();
  private subtitle: Subtitle;
  private handler: EventHandler = new EventHandler();

  private initialized: boolean = false;

  constructor() {
    super();

    this.handler
      .listen(this.libass, 'ready', () => this.onReady())
      .listen(this.libass, 'resize', () => this.onResize());
  }

  private onReady() {
    this.dispatchEvent('ready', null);
  }

  private onResize() {
    this.dispatchEvent('resize', null);
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.handler.dispose();
    this.handler = null;
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

    if (this.initialized) {
      this.libass.setTrack(subtitle.toAss());
    } else {
      this.initialized = true;
      this.libass.init(subtitle.toAss());
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
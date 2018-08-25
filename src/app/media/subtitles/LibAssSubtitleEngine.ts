import { EventHandler } from '../../libs/events/EventHandler';
import { EventTarget } from '../../libs/events/EventTarget';
import { fonts } from '../../SubtitleEngineLoader';
import { LibAss } from '../libass';
import { ISubtitleEngine, ISubtitleRect } from './ISubtitleEngine';
import { ISubtitleTrack } from './ISubtitleTrack';

export class LibAssSubtitleEngine extends EventTarget
  implements ISubtitleEngine {
  private libass = new LibAss(fonts);
  private track?: ISubtitleTrack;
  private handler: EventHandler = new EventHandler(this);

  private initialized: boolean = false;

  constructor() {
    super();

    this.handler
      .listen(this.libass, 'ready', this.onReady)
      .listen(this.libass, 'resize', this.onResize);
  }

  public attach(element: HTMLVideoElement) {
    this.libass.attach(element);
  }

  public detach() {
    this.libass.detach();
  }

  public getElement(): Element {
    return this.libass.getCanvas();
  }

  public setTrack(content: string) {
    if (this.initialized) {
      this.libass.setTrack(content);
    } else {
      this.initialized = true;
      this.libass.init(content);
    }
  }

  public getRect(): ISubtitleRect {
    const rect = this.libass.getVideoRect();

    return {
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y
    };
  }

  public resize() {
    this.libass.resize();
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.handler.dispose();
  }

  private onReady() {
    this.dispatchEvent('ready');
  }

  private onResize() {
    this.dispatchEvent('resize');
  }
}

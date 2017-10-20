import * as Hls from 'hls.js';
import { ISource } from './ISource';
import { Disposable } from '../../libs/disposable/Disposable';

export class HlsSource extends Disposable implements ISource {
  private _hls = new Hls();

  constructor(url: string) {
    super();

    this._hls.loadSource(url);
  }

  attach(element: HTMLVideoElement) {
    this._hls.attachMedia(element);
  }

  detach() {
    this._hls.detachMedia();
  }

  protected disposeInternal() {
    this._hls.destroy();
  }
}
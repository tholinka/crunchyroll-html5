import { EventHandler } from '../libs/events/EventHandler';
import { EventTarget } from '../libs/events/EventTarget';
import { getFiles, getWorkerUrl } from '../SubtitleEngineLoader';
import { CustomEvent } from './CustomEvent';

export interface IVideoRect {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface IEvent {
  data: IEventData;
}

export interface IEventData {
  [key: string]: any;
}

export interface ILibAssOptions {
  fonts: string[];
  availableFonts: string[];
}

export class LibAss extends EventTarget {
  private lastRenderTime: number = 0;
  private pixelRatio: number = window.devicePixelRatio || 1;
  private video: HTMLVideoElement | undefined;

  private offsetTime: number = 0;

  private worker: Worker | undefined;
  private videoHandler = new EventHandler(this);
  private canvas: HTMLCanvasElement = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D = this.canvas.getContext('2d')!;
  private bufferCanvas: HTMLCanvasElement = document.createElement('canvas');
  private bufferCanvasCtx: CanvasRenderingContext2D = this.bufferCanvas.getContext(
    '2d'
  )!;

  private renderFrameData: Uint8ClampedArray | undefined;
  private renderFramesData: any;
  private frameId?: number;

  private ready: boolean = false;

  private _updateable: boolean = true;

  constructor(
    private fonts: string[] = [],
    private availableFonts: { [key: string]: string } = {}
  ) {
    super();
  }

  public getCanvas(): Element {
    return this.canvas;
  }

  public init(content?: string, url?: string) {
    this.terminateWorker();
    this.createWorker();
    if (!this.worker) throw new Error('Worker is not available.');

    this.worker.postMessage({
      target: 'worker-init',
      width: this.canvas.width,
      height: this.canvas.height,
      URL: document.URL,
      currentScriptUrl: getWorkerUrl(),
      preMain: true,
      subUrl: url,
      subContent: content,
      fonts: this.fonts,
      availableFonts: this.availableFonts,
      files: getFiles()
    });
  }

  public attach(video: HTMLVideoElement) {
    this.videoHandler.removeAll();
    this.video = video;

    this.videoHandler
      .listen(video, 'playing', () => {
        this._updateable = true;
        this.setIsPaused(false, video.currentTime + this.getOffsetTime());
      })
      .listen(video, 'pause', () =>
        this.setIsPaused(true, video.currentTime + this.getOffsetTime())
      )
      .listen(video, 'seeking', () => (this._updateable = false))
      .listen(video, 'ratechange', () => this.setRate(video.playbackRate))
      .listen(video, 'timeupdate', () =>
        this.setCurrentTime(video.currentTime + this.getOffsetTime())
      )
      .listen(video, 'waiting', () =>
        this.setIsPaused(true, video.currentTime + this.getOffsetTime())
      )
      .listen(video, 'loadedmetadata', () => this.resize())
      .listen(document, 'fullscreenchange', () => this.delayedResize())
      .listen(document, 'mozfullscreenchange', () => this.delayedResize())
      .listen(document, 'webkitfullscreenchange', () => this.delayedResize())
      .listen(document, 'msfullscreenchange', () => this.delayedResize())
      .listen(window, 'resize', () => this.delayedResize());
    this.resize();
  }

  public detach() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.video = undefined;
    this.videoHandler.removeAll();
  }

  public setTrack(content: string) {
    if (!this.worker) throw new Error('Worker is not available.');
    this.worker.postMessage({
      target: 'set-track',
      content
    });
  }

  public setTrackByUrl(url: string) {
    if (!this.worker) throw new Error('Worker is not available.');
    this.worker.postMessage({
      target: 'set-track-by-url',
      url
    });
  }

  public resize(width?: number, height?: number) {
    if (!this.worker) return;

    if (!width || !height) {
      const videoRect: IVideoRect = this.getVideoRect();
      width = videoRect.width * this.pixelRatio;
      height = videoRect.height * this.pixelRatio;
    }
    if (width === 0 || height === 0) return;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;

      this.dispatchEvent('resize');

      this.worker.postMessage({
        target: 'canvas',
        width,
        height
      });
    }
  }

  public delayedResize() {
    setTimeout(() => this.resize(), 100);
    this.resize();
  }

  public getVideoRect(): IVideoRect {
    if (!this.video) return { width: 0, height: 0, x: 0, y: 0 };
    const videoRatio = this.video.videoWidth / this.video.videoHeight;
    const width = this.video.offsetWidth;
    const height = this.video.offsetHeight;
    const elementRatio = width / height;

    let realWidth = width;
    let realHeight = height;

    if (elementRatio > videoRatio) {
      realWidth = Math.ceil(height * videoRatio);
    } else {
      realHeight = Math.ceil(width / videoRatio);
    }

    const x = (width - realWidth) / 2;
    const y = (height - realHeight) / 2;

    return {
      width: realWidth,
      height: realHeight,
      x,
      y
    };
  }

  public getOffsetTime(): number {
    return this.offsetTime;
  }

  public setOffsetTime(offsetTime: number) {
    this.offsetTime = offsetTime;

    if (this.video) {
      this.setCurrentTime(this.video.currentTime + this.getOffsetTime());
    }
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.terminateWorker();
  }

  private renderFrame() {
    if (!this.renderFrameData) return;
    this.ctx.putImageData(
      new ImageData(
        this.renderFrameData,
        this.canvas.width,
        this.canvas.height
      ),
      0,
      0
    );
    this.renderFrameData = undefined;
  }

  private renderFrames() {
    const data = this.renderFramesData;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const image of data.canvases) {
      this.bufferCanvas.width = image.w;
      this.bufferCanvas.height = image.h;
      this.bufferCanvasCtx.putImageData(
        new ImageData(new Uint8ClampedArray(image.buffer), image.w, image.h),
        0,
        0
      );
      this.ctx.drawImage(this.bufferCanvas, image.x, image.y);
    }
  }

  private setIsPaused(paused: boolean, currentTime: number) {
    if (!this._updateable) return;
    if (!this.worker) throw new Error('Worker is not available.');
    this.worker.postMessage({
      target: 'video',
      isPaused: paused,
      currentTime
    });
  }

  private setCurrentTime(currentTime: number) {
    if (!this._updateable) return;
    if (!this.worker) throw new Error('Worker is not available.');
    this.worker.postMessage({
      target: 'video',
      currentTime
    });
  }

  private setRate(rate: number) {
    if (!this.worker) throw new Error('Worker is not available.');
    this.worker.postMessage({
      target: 'video',
      rate
    });
  }

  private customMessage(data: any, options: any = {}) {
    if (!this.worker) throw new Error('Worker is not available.');
    this.worker.postMessage({
      target: 'custom',
      userData: data,
      preMain: options.preMain
    });
  }

  private createWorker() {
    if (this.worker) return;

    this.worker = new Worker(getWorkerUrl());
    this.worker.onerror = error => this.onWorkerError(error);
    this.worker.onmessage = event => this.onWorkerMessage(event);
  }

  private onWorkerError(error: any) {
    this.dispatchEvent('error');
  }

  private onWorkerMessage(event: IEvent) {
    if (!this.ready) {
      this.ready = true;
      this.dispatchEvent('ready');
    }
    const data = event.data;
    switch (data.target) {
      case 'stdout':
        // console.log(data.content);
        break;
      case 'stderr':
        console.error(data.content);
        break;
      case 'window':
        (window as any)[data.method]();
        break;
      case 'canvas':
        switch (data.op) {
          case 'getContext':
            this.ctx = this.canvas.getContext(
              data.type,
              data.attributes
            ) as CanvasRenderingContext2D;
            break;
          case 'resize':
            this.resize(data.width, data.height);
            break;
          case 'render':
            if (!this.renderFrameData) {
              window.requestAnimationFrame(() => this.renderFrame());
            }
            if (data.buffer) {
              this.renderFrameData = new Uint8ClampedArray(data.buffer);
            } else {
              this.renderFrameData = data.image.data;
            }
            break;
          case 'renderMultiple':
            if (this.lastRenderTime <= data.time) {
              this.lastRenderTime = data.time;
              this.renderFramesData = data;
              window.requestAnimationFrame(() => this.renderFrames());
            }
            break;
          case 'setObjectProperty':
            (this.canvas as any)[data.object][data.property] = data.value;
        }
        break;
      case 'tick':
        this.frameId = data.id;
        if (!this.worker) throw new Error('Worker is not available.');
        this.worker.postMessage({
          target: 'tock',
          id: this.frameId
        });
        break;
      case 'Image':
        console.assert(data.method === 'src');
        const img = new Image();
        img.onload = () => {
          console.assert(img.complete);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          if (!this.worker) throw new Error('Worker is not available.');
          this.worker.postMessage({
            target: 'Image',
            method: 'onload',
            id: data.id,
            width: img.width,
            height: img.height,
            data: imageData.data,
            preMain: true
          });
        };
        img.onerror = () => {
          if (!this.worker) throw new Error('Worker is not available.');
          this.worker.postMessage({
            target: 'Image',
            method: 'onerror',
            id: data.id,
            preMain: true
          });
        };
        img.src = data.src;
        break;
      case 'custom':
        this.dispatchEvent(new CustomEvent(data));
        break;
      case 'setimmediate':
        if (!this.worker) throw new Error('Worker is not available.');
        this.worker.postMessage({
          target: 'setimmediate'
        });
    }
  }

  private terminateWorker() {
    if (this.worker) {
      this.worker.terminate();
      this.ready = false;
      this.worker = undefined;
    }
  }
}

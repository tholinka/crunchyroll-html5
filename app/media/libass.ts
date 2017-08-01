import { EventTarget } from '../events/eventtarget';
import { EventHandler } from '../events/eventhandler';
import * as _ from 'lodash';
import { binaryToBlob } from '../utils/blob';

const libassWorkerJS = require('raw-loader!../../vendor/JavascriptSubtitlesOctopus/subtitles-octopus-worker.js');
const libassDefaultFont = require('binary-loader!../../vendor/JavascriptSubtitlesOctopus/default.ttf');
const libassFontsConfig = require('raw-loader!../../vendor/JavascriptSubtitlesOctopus/fonts.conf');

const libassWorkerUrl = URL.createObjectURL(new Blob([libassWorkerJS], { type: "text/javascript" }));
const libassDefaultFontUrl = URL.createObjectURL(binaryToBlob(libassDefaultFont, "application/octet-stream"));
const libassFontsConfigUrl = URL.createObjectURL(new Blob([libassFontsConfig], { type: "application/xml" }));

interface IVideoRect {
  width: number,
  height: number,
  x: number,
  y: number
}

interface IEvent {
  data: IEventData
}

interface IEventData {
  [key: string]: any
}

export interface ILibAssOptions {
  fonts: string[];
  availableFonts: string[];
}

export class LibAss extends EventTarget {
  private lastRenderTime: number = 0;
  private pixelRatio: number = window.devicePixelRatio || 1;
  private video: HTMLVideoElement;

  private offsetTime: number = 0;

  private worker: Worker;
  private videoHandler = new EventHandler(this);
  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D = this.canvas.getContext("2d");
  private bufferCanvas: HTMLCanvasElement = document.createElement("canvas");
  private bufferCanvasCtx: CanvasRenderingContext2D = this.bufferCanvas.getContext("2d");

  private renderFrameData: Uint8ClampedArray;
  private renderFramesData;
  private frameId: number;

  private ready: boolean = false;

  constructor(
    private fonts: string[] = [],
    private availableFonts: {[key: string]: string} = {}
  ) {
    super();
  }

  getCanvas(): Element {
    return this.canvas;
  }

  init(content?: string, url?: string) {
    this.terminateWorker();
    this.createWorker();

    this.worker.postMessage({
      target: 'worker-init',
      width: this.canvas.width,
      height: this.canvas.height,
      URL: document.URL,
      currentScriptUrl: libassWorkerUrl,
      preMain: true,
      subUrl: url,
      subContent: content,
      fonts: this.fonts,
      availableFonts: this.availableFonts,
      files: {
        'fonts.conf': { url: libassFontsConfigUrl },
        'default.ttf': { url: libassDefaultFontUrl }
      }
    });
  }
  
  attach(video: HTMLVideoElement) {
    this.videoHandler.clear();
    this.video = video;

    this.videoHandler
      .listen(video, 'playing', () => this.setIsPaused(false, video.currentTime + this.getOffsetTime()))
      .listen(video, 'pause', () => this.setIsPaused(true, video.currentTime + this.getOffsetTime()))
      .listen(video, 'seeking', () => this.setCurrentTime(video.currentTime + this.getOffsetTime()))
      .listen(video, 'ratechange', () => this.setRate(video.playbackRate))
      .listen(video, 'timeupdate', () => this.setCurrentTime(video.currentTime + this.getOffsetTime()))
      .listen(video, 'loadedmetadata', () => this.resize())
      .listen(document, 'fullscreenchange', () => this.delayedResize())
      .listen(document, 'mozfullscreenchange', () => this.delayedResize())
      .listen(document, 'webkitfullscreenchange', () => this.delayedResize())
      .listen(document, 'msfullscreenchange', () => this.delayedResize())
      .listen(window, 'resize', () => this.delayedResize());
    this.resize();
  }

  detach() {
    this.video = null;
    this.videoHandler.clear();
  }

  setTrack(content: string) {
    this.worker.postMessage({
      target: 'set-track',
      content: content
    });
  }

  setTrackByUrl(url: string) {
    this.worker.postMessage({
      target: 'set-track-by-url',
      url: url
    });
  }

  resize(width?: number, height?: number) {
    if (!this.worker) return;

    if (!width || !height) {
      let videoRect: IVideoRect = this.getVideoRect();
      width = videoRect.width * this.pixelRatio;
      height = videoRect.height * this.pixelRatio;
    }

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;

      this.dispatchEvent('resize', null);

      this.worker.postMessage({
        target: 'canvas',
        width: width,
        height: height
      });
    }
  }

  delayedResize() {
    setTimeout(() => this.resize(), 100);
    this.resize();
  }

  getVideoRect(): IVideoRect {
    const videoRatio = this.video.videoWidth / this.video.videoHeight;
    const width = this.video.offsetWidth;
    const height = this.video.offsetHeight;
    const elementRatio = width / height;

    var realWidth = width;
    var realHeight = height;

    if (elementRatio > videoRatio) {
      realWidth = Math.floor(height * videoRatio);
    } else {
      realHeight = Math.floor(width / videoRatio);
    }

    var x = (width - realWidth) / 2;
    var y = (height - realHeight) / 2;

    return {
      width: realWidth,
      height: realHeight,
      x: x,
      y: y
    };
  }

  getOffsetTime(): number {
    return this.offsetTime;
  }

  setOffsetTime(offsetTime: number) {
    this.offsetTime = offsetTime;

    if (this.video) {
      this.setCurrentTime(this.video.currentTime + this.getOffsetTime());
    }
  }

  private renderFrame() {
    this.ctx.putImageData(new ImageData(this.renderFrameData, this.canvas.width, this.canvas.height), 0, 0);
    this.renderFrameData = null;
  }

  private renderFrames() {
    var data = this.renderFramesData;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (var i = 0; i < data.canvases.length; i++) {
      var image = data.canvases[i];
      this.bufferCanvas.width = image.w;
      this.bufferCanvas.height = image.h;
      this.bufferCanvasCtx.putImageData(new ImageData(new Uint8ClampedArray(image.buffer), image.w, image.h), 0, 0);
      this.ctx.drawImage(this.bufferCanvas, image.x, image.y);
    }
  }

  private setIsPaused(paused: boolean, currentTime: number) {
    this.worker.postMessage({
      target: 'video',
      isPaused: paused,
      currentTime: currentTime
    });
  }

  private setCurrentTime(currentTime: number) {
    this.worker.postMessage({
      target: 'video',
      currentTime: currentTime
    });
  }

  private setRate(rate: number) {
    this.worker.postMessage({
      target: 'video',
      rate: rate
    });
  }

  private customMessage(data: any, options: any = {}) {
    this.worker.postMessage({
      target: 'custom',
      userData: data,
      preMain: options.preMain
    });
  }

  private createWorker() {
    if (this.worker) return;

    this.worker = new Worker(libassWorkerUrl);
    this.worker.onerror = error => this.onWorkerError(error);
    this.worker.onmessage = event => this.onWorkerMessage(event);
  }

  private onWorkerError(error) {
    this.dispatchEvent('error', error);
  }

  private onWorkerMessage(event: IEvent) {
    if (!this.ready) {
      this.ready = true;
      this.dispatchEvent('ready', null);
    }
    var data = event.data;
    switch (data.target) {
      case 'stdout':
        //console.log(data.content);
        break;
      case 'stderr':
        console.error(data.content);
        break;
      case 'window':
        window[data.method]();
        break;
      case 'canvas':
        switch (data.op) {
          case 'getContext':
            this.ctx = <CanvasRenderingContext2D> this.canvas.getContext(data.type, data.attributes);
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
            this.canvas[data.object][data.property] = data.value;
        }
        break;
      case 'tick':
        this.frameId = data.id;
        this.worker.postMessage({
          target: 'tock',
          id: this.frameId
        });
        break;
      case 'Image':
        console.assert(data.method === 'src');
        var img = new Image();
        img.onload = () => {
          console.assert(img.complete);
          let canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          let ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          let imageData = ctx.getImageData(0, 0, img.width, img.height);
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
        this.dispatchEvent('custom', event);
        break;
      case 'setimmediate':
        this.worker.postMessage({
          target: 'setimmediate'
        });
    }
  }

  private terminateWorker() {
    if (this.worker) {
      this.worker.terminate();
      this.ready = false;
      this.worker = null;
    }
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.terminateWorker();
  }
}
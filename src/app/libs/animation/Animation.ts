import { IAnimation } from './IAnimation';
import { EventTarget } from '../events/EventTarget';
import { requestAnimationFrame, cancelAnimationFrame } from '../../utils/animation';

export class Animation extends EventTarget implements IAnimation {
  private _running: boolean = false;
  private _startTime?: number;
  private _frameId?: number;

  constructor(
    public duration: number
  ) {
    super();
  }

  private _tick() {
    if (this._startTime === undefined) throw new Error("StartTime is not set");

    const now = window.performance.now();
    const dt = now - this._startTime;
    const progress = Math.max(Math.min(dt/this.duration, 1), 0);

    this.tickInternal(progress);

    if (dt >= this.duration) {
      this._running = false;
      this.dispatchEvent('animationend');
    }

    if (this._running) {
      this._frameId = requestAnimationFrame(() => this._tick());
    }
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.stop();
  }

  protected tickInternal(progress: number) {

  }

  start(): void {
    if (this.isRunning()) return;
    this._startTime = window.performance.now();
    this._running = true;

    this._tick();
  }

  stop(): void {
    if (!this.isRunning()) return;
    
    cancelAnimationFrame(this._frameId);
    this._running = false;
  }

  isRunning(): boolean {
    return this._running;
  }
}
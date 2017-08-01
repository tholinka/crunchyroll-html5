import { EventTarget } from '../events/eventtarget';

export function morph(fromPath: (string|number)[], toPath: (string|number)[], percentage: number) {
  var deltaPath = "";
  for (var i = 0; i < fromPath.length; i++) {
    var from = fromPath[i];
    var to = toPath[i];
    if (typeof from === "number" && typeof to === "number") {
      deltaPath += '' + (from + (to - from) * percentage);
    } else {
      deltaPath += fromPath[i];
    }
  }
  return deltaPath;
}

export function parseSvgPath(path: string): (string|number)[] {
  var values: (string|number)[] = [];
  var m = path.match(/[0-9.-]+|[^0-9.-]+/g);
  for (var i = 0; i < m.length; i++) {
    let value = parseFloat(m[i]);
    values.push(isNaN(value) ? m[i] : value);
  }
  return values;
}

export abstract class Animation extends EventTarget {
  private startTime: number;
  private running: boolean = false;
  private frameId: number;

  constructor(
    private duration: number = 200
  ) {
    super();
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.running = false;
    window.cancelAnimationFrame(this.frameId);
  }

  protected abstract tickInternal(progress: number);

  private tick() {
    var now = window.performance.now();
    var dt = now - this.startTime;
    var progress = Math.min(dt/this.duration, 1);

    this.tickInternal(progress);

    if (dt >= this.duration) {
      this.running = false;
      this.dispatchEvent('animationend', '');
    }

    if (this.running) {
      this.frameId = window.requestAnimationFrame(() => this.tick());
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  start() {
    this.running = true;
    this.startTime = window.performance.now();

    this.tick();
  }

  stop() {
    this.running = false;
    window.cancelAnimationFrame(this.frameId);
  }
}

export class SvgAnimation extends Animation {
  private fromPath: string;
  private toPath: string;

  private fromTransition: (string|number)[];
  private toTransition: (string|number)[];

  constructor(
    private pathElement: Element,
    duration: number = 200
  ) {
    super(duration);
  }

  private setPath(path: string) {
    this.pathElement.setAttribute("d", path);
  }

  protected tickInternal(progress: number) {
    if (progress === 1) {
      this.setPath(this.toPath);
    } else {
      this.setPath(morph(this.fromTransition, this.toTransition, progress));
    }
  }

  setFromPath(transitionPath: string, path?: string) {
    this.fromPath = path || transitionPath;
    this.fromTransition = parseSvgPath(transitionPath);
  }

  setToPath(transitionPath: string, path?: string) {
    this.toPath = path || transitionPath;
    this.toTransition = parseSvgPath(transitionPath);
  }
}
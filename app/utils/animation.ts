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

export class SvgAnimation extends EventTarget {
  private startTime: number;
  private fromPath: string;
  private toPath: string;

  private fromTransition: (string|number)[];
  private toTransition: (string|number)[];

  private running: boolean = false;
  private frameId: number;

  constructor(
    private pathElement: Element,
    private duration: number = 200
  ) {
    super();
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.running = false;
    window.cancelAnimationFrame(this.frameId);
  }

  private setPath(path: string) {
    this.pathElement.setAttribute("d", path);
  }

  private tick() {
    var now = window.performance.now();
    var dt = now - this.startTime;

    if (dt >= this.duration) {
      this.setPath(this.toPath);
      this.running = false;

      this.dispatchEvent('animationend', '');
    } else {
      this.setPath(morph(this.fromTransition, this.toTransition, dt/this.duration));
    }

    if (this.running) {
      this.frameId = window.requestAnimationFrame(() => this.tick());
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
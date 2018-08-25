import { Animation } from "./Animation";

function morph(fromPath: Array<string|number>, toPath: Array<string|number>, percentage: number): string {
  let deltaPath = "";
  for (let i = 0; i < fromPath.length; i++) {
    const from = fromPath[i];
    const to = toPath[i];
    if (typeof from === "number" && typeof to === "number") {
      deltaPath += '' + (from + (to - from) * percentage);
    } else {
      deltaPath += fromPath[i];
    }
  }
  return deltaPath;
}

function parseSvgPath(path: string): Array<string|number>|undefined {
  const values: Array<string|number> = [];
  const m = path.match(/[0-9.-]+|[^0-9.-]+/g);
  if (!m) return undefined;
  for (const n of m) {
    const value = parseFloat(n);
    values.push(isNaN(value) ? n : value);
  }
  return values;
}

export class SvgPathMorphAnimation extends Animation {
  private _pathElement: SVGPathElement;

  private _fromPath?: string;
  private _toPath?: string;

  private _parsedFromPath?: Array<string|number>;
  private _parsedToPath?: Array<string|number>;

  constructor(pathElement: SVGPathElement, duration: number) {
    super(duration);

    this._pathElement = pathElement;
  }
  
  public setFromPath(path: string): void {
    const parsed = parseSvgPath(path);
    if (!parsed) throw new Error("Unable to parse the path (" + path + ").");
    this._fromPath = path;
    this._parsedFromPath = parsed;
  }

  public setToPath(path: string): void {
    const parsed = parseSvgPath(path);
    if (!parsed) throw new Error("Unable to parse the path (" + path + ").");
    this._toPath = path;
    this._parsedToPath = parsed;
  }

  protected tickInternal(progress: number) {
    if (!this._toPath) throw new Error("ToPath is not defined");
    if (!this._parsedFromPath) throw new Error("ParsedFromPath is not defined");
    if (!this._parsedToPath) throw new Error("ParsedToPath is not defined");

    super.tickInternal(progress);

    if (progress === 1) {
      this._setPath(this._toPath);
    } else {
      this._setPath(morph(this._parsedFromPath, this._parsedToPath, progress));
    }
  }

  private _setPath(path: string) {
    this._pathElement.setAttribute("d", path);
  }
}
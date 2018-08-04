import { Animation } from "./Animation";

function morph(fromPath: (string|number)[], toPath: (string|number)[], percentage: number): string {
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

function parseSvgPath(path: string): (string|number)[]|undefined {
  const values: (string|number)[] = [];
  const m = path.match(/[0-9.-]+|[^0-9.-]+/g);
  if (!m) return undefined;
  for (let i = 0; i < m.length; i++) {
    const value = parseFloat(m[i]);
    values.push(isNaN(value) ? m[i] : value);
  }
  return values;
}

export class SvgPathMorphAnimation extends Animation {
  private _pathElement: SVGPathElement;

  private _fromPath?: string;
  private _toPath?: string;

  private _parsedFromPath?: (string|number)[];
  private _parsedToPath?: (string|number)[];

  constructor(pathElement: SVGPathElement, duration: number) {
    super(duration);

    this._pathElement = pathElement;
  }

  private _setPath(path: string) {
    this._pathElement.setAttribute("d", path);
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
  
  setFromPath(path: string): void {
    const parsed = parseSvgPath(path);
    if (!parsed) throw new Error("Unable to parse the path (" + path + ").");
    this._fromPath = path;
    this._parsedFromPath = parsed;
  }

  setToPath(path: string): void {
    const parsed = parseSvgPath(path);
    if (!parsed) throw new Error("Unable to parse the path (" + path + ").");
    this._toPath = path;
    this._parsedToPath = parsed;
  }
}
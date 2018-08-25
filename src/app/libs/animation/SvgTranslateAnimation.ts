import { SvgPathMorphAnimation } from "./SvgPathMorphAnimation";

export class SvgTranslateAnimation extends SvgPathMorphAnimation {
  private _translateToX: number = 0;
  private _translateToY: number = 0;

  private _translateFromX: number = 0;
  private _translateFromY: number = 0;

  private _translateElements: Element[];

  constructor(
    pathElement: SVGPathElement,
    translateElements: Element[],
    duration: number = 200
  ) {
    super(pathElement, duration);

    this._translateElements = translateElements;
  }

  public setTranslateTo(x: number, y: number) {
    this._translateToX = x;
    this._translateToY = y;
  }

  public setTranslateFrom(x: number, y: number) {
    this._translateFromX = x;
    this._translateFromY = y;
  }

  protected tickInternal(progress: number) {
    super.tickInternal(progress);

    const x = (this._translateToX - this._translateFromX)*progress + this._translateFromX;
    const y = (this._translateToY - this._translateFromY)*progress + this._translateFromY;
    for (const translateElement of this._translateElements) {
      translateElement.setAttribute("transform", "translate(" + x + "," + y + ")");
    }
  }
}
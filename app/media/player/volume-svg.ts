import { SvgAnimation } from '../../utils/animation';
import { ICON_VOLUME, ICON_VOLUME_HIGH, ICON_VOLUME_LOW, ICON_VOLUME_MUTE } from '../../assets/svg-paths';
import { EventHandler } from '../../events/eventhandler';
import { Disposable } from '../../disposable';

export enum VolumeSvgState {
  MUTED, HIGH, LOW
}

class SvgTranslateAnimation extends SvgAnimation {
  private translateToX: number = 0;
  private translateToY: number = 0;

  private translateFromX: number = 0;
  private translateFromY: number = 0;

  constructor(
    pathElement: Element,
    private translateElements: Element[],
    duration?: number
  ) {
    super(pathElement, duration);
  }

  protected tickInternal(progress: number) {
    super.tickInternal(progress);

    var x = (this.translateToX - this.translateFromX)*progress + this.translateFromX;
    var y = (this.translateToY - this.translateFromY)*progress + this.translateFromY;
    for (let i = 0; i < this.translateElements.length; i++) {
      this.translateElements[i].setAttribute("transform", "translate(" + x + "," + y + ")");
    }
  }

  setTranslateTo(x: number, y: number) {
    this.translateToX = x;
    this.translateToY = y;
  }

  setTranslateFrom(x: number, y: number) {
    this.translateFromX = x;
    this.translateFromY = y;
  }
}

export class VolumeSvg extends Disposable {
  private element: SVGElement;

  private maskPath: SVGElement;
  private slashMaskPath: SVGElement;

  private defs: SVGElement;
  private speakerPath: SVGElement;
  private hiderPath: SVGElement;

  private mutePath: SVGElement;

  private animation: SvgTranslateAnimation;

  private handler = new EventHandler(this);
  private state: VolumeSvgState = VolumeSvgState.HIGH;

  constructor() {
    super();

    this.element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.element.setAttribute("width", "100%");
    this.element.setAttribute("height", "100%");
    this.element.setAttribute("version", "1.1");
    this.element.setAttribute("viewBox", "0 0 36 36");

    this.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    var clipPathMask = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPathMask.setAttribute("id", "html5-player-svg-volume-animation-mask");

    var maskStaticPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    maskStaticPath.setAttribute("d", "m 14.35,-0.14 -5.86,5.86 20.73,20.78 5.86,-5.91 z");

    clipPathMask.appendChild(maskStaticPath);

    var maskStatic2Path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    maskStatic2Path.setAttribute("d", "M 7.07,6.87 -1.11,15.33 19.61,36.11 27.80,27.60 z");

    clipPathMask.appendChild(maskStatic2Path);

    this.maskPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.maskPath.setAttribute("d", "M 9.09,5.20 6.47,7.88 26.82,28.77 29.66,25.99 z");
    this.maskPath.setAttribute("transform", "translate(0,0)");

    clipPathMask.appendChild(this.maskPath);
    this.defs.appendChild(clipPathMask);

    var clipPathSlashMask = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPathSlashMask.setAttribute("id", "html5-player-svg-volume-animation-slash-mask");

    this.slashMaskPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.slashMaskPath.setAttribute("d", "m -11.45,-15.55 -4.44,4.51 20.45,20.94 4.55,-4.66 z");
    this.slashMaskPath.setAttribute("transform", "translate(0,0)");

    clipPathSlashMask.appendChild(this.slashMaskPath);
    this.defs.appendChild(clipPathSlashMask);

    this.element.appendChild(this.defs);

    this.speakerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.speakerPath.setAttribute("d", ICON_VOLUME + " " + ICON_VOLUME_HIGH);
    this.speakerPath.setAttribute("fill", "#ffffff");
    this.speakerPath.setAttribute("clip-path", "url(#html5-player-svg-volume-animation-mask)");

    this.hiderPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.hiderPath.setAttribute("d", "M 9.25,9 7.98,10.27 24.71,27 l 1.27,-1.27 Z");
    this.hiderPath.setAttribute("fill", "#ffffff");
    this.hiderPath.setAttribute("clip-path", "url(#html5-player-svg-volume-animation-slash-mask)");
    this.hiderPath.style.display = "none";

    this.element.appendChild(this.speakerPath);
    this.element.appendChild(this.hiderPath);

    this.mutePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.mutePath.setAttribute("d", ICON_VOLUME_MUTE);
    this.mutePath.setAttribute("fill", "#ffffff");

    this.animation = new SvgTranslateAnimation(this.speakerPath, [this.maskPath, this.slashMaskPath])

    this.handler
      .listen(this.animation, 'animationend', this.handleAnimationEnd);
  }

  private handleAnimationEnd() {
    switch (this.state) {
      case VolumeSvgState.LOW:
        this.speakerPath.setAttribute("d", ICON_VOLUME);
        this.hiderPath.style.display = "none";
        this.maskPath.setAttribute("transform", "translate(0,0)");
        this.slashMaskPath.setAttribute("transform", "translate(0,0)");
        break;
      case VolumeSvgState.HIGH:
        this.speakerPath.setAttribute("d", ICON_VOLUME + " " + ICON_VOLUME_HIGH);
        this.hiderPath.style.display = "none";
        this.maskPath.setAttribute("transform", "translate(0,0)");
        this.slashMaskPath.setAttribute("transform", "translate(0,0)");
        break;
      case VolumeSvgState.MUTED:
        this.speakerPath.setAttribute("d", ICON_VOLUME_MUTE);
        this.hiderPath.style.display = "";
        this.maskPath.setAttribute("transform", "translate(16,16)");
        this.slashMaskPath.setAttribute("transform", "translate(16,16)");
        break;
    }
    this.setMuteView(this.state === VolumeSvgState.MUTED);
  }

  /**
   * Updates the animation origin
   */
  private _updateAnimationOrigin() {
    var path = this.speakerPath.getAttribute("d");
    if (!this.animation.isRunning()) {
      switch (this.state) {
        case VolumeSvgState.LOW:
          path = ICON_VOLUME + " " + ICON_VOLUME_LOW;
          break;
        case VolumeSvgState.HIGH:
          path = ICON_VOLUME + " " + ICON_VOLUME_HIGH;
          break;
        case VolumeSvgState.MUTED:
          path = ICON_VOLUME + " " + ICON_VOLUME_HIGH;
          break;
      }
    }
    
    this.animation.setFromPath(path);

    var transform = this.maskPath.getAttribute("transform");
    var x = 0;
    var y = 0;

    if (transform) {
      let m = transform.match(/translate\((\-?[0-9]+(?:\.[0-9]+)?)\s*,\s*(\-?[0-9]+(?:\.[0-9]+)?)\)/);
      x = parseFloat(m[1]);
      y = parseFloat(m[2]);
    }

    this.animation.setTranslateFrom(x, y);
  }

  getElement(): Element {
    return this.element;
  }

  private setMuteView(mute: boolean) {
    if (mute) {
      this.element.innerHTML = "";
      this.element.appendChild(this.mutePath);
    } else {
      this.element.innerHTML = "";
      this.element.appendChild(this.defs);
      this.element.appendChild(this.speakerPath);
      this.element.appendChild(this.hiderPath);
    }
  }

  setState(state: VolumeSvgState, animate: boolean = true) {
    if (this.state === state) return;

    if (animate) {
      this.setMuteView(false);
      this._updateAnimationOrigin();

      this.state = state;
      this.animation.stop();

      let path = null;
      switch (state) {
        case VolumeSvgState.MUTED:
          this.hiderPath.style.display = "";
          this.animation.setTranslateTo(16, 16);
          path = ICON_VOLUME + " " + ICON_VOLUME_HIGH;
          break;
        case VolumeSvgState.HIGH:
          this.animation.setTranslateTo(0, 0);
          path = ICON_VOLUME + " " + ICON_VOLUME_HIGH;
          break;
        case VolumeSvgState.LOW:
          this.animation.setTranslateTo(0, 0);
          path = ICON_VOLUME + " " + ICON_VOLUME_LOW;
          break;
      }
      this.animation.setToPath(path);
      this.animation.start();
    } else {
      this.animation.stop();
      this.state = state;

      let path = null;
      let translate = "translate(0,0)";
      switch (state) {
        case VolumeSvgState.MUTED:
          this.hiderPath.style.display = "";
          translate = "translate(16,16)";
          path = ICON_VOLUME + " " + ICON_VOLUME_HIGH;
          break;
        case VolumeSvgState.HIGH:
          path = ICON_VOLUME + " " + ICON_VOLUME_HIGH;
          break;
        case VolumeSvgState.LOW:
          path = ICON_VOLUME;
          break;
      }

      this.speakerPath.setAttribute("d", path);
      this.maskPath.setAttribute("transform", translate);
      this.slashMaskPath.setAttribute("transform", translate);
      this.setMuteView(state === VolumeSvgState.MUTED);
    }
  }
}
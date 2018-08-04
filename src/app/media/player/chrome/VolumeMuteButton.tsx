import { h, Component, render } from "preact";
import { IPlayerApi, VolumeChangeEvent } from "../IPlayerApi";
import { EventHandler } from "../../../libs/events/EventHandler";
import { SvgTranslateAnimation } from "../../../libs/animation/SvgTranslateAnimation";
import { ICON_VOLUME, ICON_VOLUME_HIGH, ICON_VOLUME_MUTE, ICON_VOLUME_LOW } from "../assets";

export interface IVolumeMuteButtonProps {
  api: IPlayerApi;
  onHover?: () => void;
  onEndHover?: () => void;
}

enum VolumeMuteState {
  MUTED,
  HIGH,
  LOW
}

export class VolumeMuteButton extends Component<IVolumeMuteButtonProps, {}> {
  private _handler: EventHandler = new EventHandler(this);
  
  private _svgElement?: SVGElement;
  private _defsElement?: SVGDefsElement;
  private _speakerPathElement?: SVGPathElement;
  private _maskPathElement?: SVGPathElement;
  private _slashMaskPathElement?: SVGPathElement;
  private _hiderPathElement?: SVGPathElement;
  private _mutePathElement?: SVGPathElement;

  private _animation?: SvgTranslateAnimation;

  private _state: VolumeMuteState = VolumeMuteState.HIGH;

  private _mouseover: boolean = false;

  private _onClick(): void {
    const api = this.props.api;
    if (api.isMuted()) {
      api.unmute();
    } else if (api.getVolume() === 0) {
      api.setVolume(1);
    } else {
      api.mute();
    }
  }

  private _onVolumeData(volume: number, muted: boolean): void {
    if (muted || volume === 0) {
      this._setState(VolumeMuteState.MUTED);
    } else {
      if (volume < 0.5) {
        this._setState(VolumeMuteState.LOW);
      } else {
        this._setState(VolumeMuteState.HIGH);
      }
    }
    if (this._mouseover) {
      this._onMouseOver();
    }
  }

  private _onVolumeChange(e: VolumeChangeEvent): void {
    this._onVolumeData(e.volume, e.muted);
  }

  private _setState(state: VolumeMuteState, animate: boolean = true): void {
    if (this._state === state || !this._animation) return;
    if (animate) {
      this._setMuteView(false);
      this._updateAnimationOrigin();

      this._state = state;
      this._animation.stop();

      let path: string = ICON_VOLUME + " " + ICON_VOLUME_HIGH;
      switch (state) {
        case VolumeMuteState.HIGH:
          this._animation.setTranslateTo(0, 0);
          break;
        case VolumeMuteState.LOW:
          this._animation.setTranslateTo(0, 0);
          path = ICON_VOLUME + " " + ICON_VOLUME_LOW;
          break;
        case VolumeMuteState.MUTED:
          if (this._hiderPathElement) {
            this._hiderPathElement.style.display = "";
          }
          this._animation.setTranslateTo(16, 16);
          break;
      }
      this._animation.setToPath(path);
      this._animation.start();
    } else {
      this._animation.stop();
      this._state = state;

      let path: string = ICON_VOLUME + " " + ICON_VOLUME_HIGH;
      let translate: string = "translate(0,0)";
      switch (state) {
        case VolumeMuteState.HIGH:
          break;
        case VolumeMuteState.LOW:
          path = ICON_VOLUME;
          break;
        case VolumeMuteState.MUTED:
          if (this._hiderPathElement) {
            this._hiderPathElement.style.display = "";
          }
          translate = "translate(16,16)";
          break;
      }

      if (this._speakerPathElement) {
        this._speakerPathElement.setAttribute('d', path);
      }
      if (this._maskPathElement) {
        this._maskPathElement.setAttribute('transform', translate);
      }
      if (this._slashMaskPathElement) {
        this._slashMaskPathElement.setAttribute('transform', translate);
      }

      this._setMuteView(state === VolumeMuteState.MUTED);
    }
  }

  private _setMuteView(muted: boolean): void {
    const el = this._svgElement;
    if (!el || !this._mutePathElement || !this._defsElement || !this._speakerPathElement || !this._hiderPathElement) return;
    el.innerHTML = "";
    if (muted) {
      el.appendChild(this._mutePathElement);
    } else {
      el.appendChild(this._defsElement);
      el.appendChild(this._speakerPathElement);
      el.appendChild(this._hiderPathElement);
    }
  }

  private _onAnimationEnd(): void {
    if (!this._slashMaskPathElement || !this._maskPathElement || !this._speakerPathElement || !this._hiderPathElement) return;

    switch (this._state) {
      case VolumeMuteState.HIGH:
        this._speakerPathElement.setAttribute("d", ICON_VOLUME + ' ' + ICON_VOLUME_HIGH);
        this._hiderPathElement.style.display = "none";
        this._maskPathElement.setAttribute("transform", "translate(0,0)");
        this._slashMaskPathElement.setAttribute("transform", "translate(0,0)");
        break;
      case VolumeMuteState.LOW:
        this._speakerPathElement.setAttribute("d", ICON_VOLUME);
        this._hiderPathElement.style.display = "none";
        this._maskPathElement.setAttribute("transform", "translate(0,0)");
        this._slashMaskPathElement.setAttribute("transform", "translate(0,0)");
        break;
      case VolumeMuteState.MUTED:
        this._speakerPathElement.setAttribute("d", ICON_VOLUME_MUTE);
        this._hiderPathElement.style.display = "";
        this._maskPathElement.setAttribute("transform", "translate(16,16)");
        this._slashMaskPathElement.setAttribute("transform", "translate(16,16)");
        break;
    }
    this._setMuteView(this.state === VolumeMuteState.MUTED);
  }

  private _updateAnimationOrigin() {
    if (!this._speakerPathElement || !this._animation || !this._maskPathElement) return;
    let path = this._speakerPathElement.getAttribute('d');
    if (!this._animation.isRunning()) {
      switch (this._state) {
        case VolumeMuteState.LOW:
          path = ICON_VOLUME + ' ' + ICON_VOLUME_LOW;
          break;
        case VolumeMuteState.HIGH:
        case VolumeMuteState.MUTED:
          path = ICON_VOLUME + ' ' + ICON_VOLUME_HIGH;
          break;
      }
    }
    if (!path) path = ICON_VOLUME + ' ' + ICON_VOLUME_HIGH;
    this._animation.setFromPath(path);
    
    const transform = this._maskPathElement.getAttribute('transform');
    let x = 0, y = 0;

    if (transform) {
      const m = transform.match(/translate\((\-?[0-9]+(?:\.[0-9]+)?)\s*,\s*(\-?[0-9]+(?:\.[0-9]+)?)\)/);
      if (m) {
        x = parseFloat(m[1]);
        y = parseFloat(m[2]);
      }
    }
    this._animation.setTranslateFrom(x, y);
  }
  
  private _onMouseOver() {
    this._mouseover = true;
    if (this.props.onHover) {
      this.props.onHover();
    }
  }
  
  private _onMouseOut() {
    this._mouseover = false;
    if (this.props.onEndHover) {
      this.props.onEndHover();
    }
  }

  componentDidMount() {
    if (!this._speakerPathElement || !this._maskPathElement || !this._slashMaskPathElement) return;
    this._animation = new SvgTranslateAnimation(this._speakerPathElement, [this._maskPathElement, this._slashMaskPathElement]);

    this._handler
      .listen(this.base, 'mouseover', this._onMouseOver, { passive: true })
      .listen(this.base, 'mouseout', this._onMouseOut, { passive: true })
      .listen(this._animation, 'animationend', this._onAnimationEnd, false)
      .listen(this.props.api, 'volumechange', this._onVolumeChange, false);
    
    this._onVolumeData(this.props.api.getVolume(), this.props.api.isMuted());
  }

  componentWillUnmount() {
    this._handler.removeAll();
  }

  render(): JSX.Element {
    const onClick = () => this._onClick();
    const svgRef = (el?: Element) => this._svgElement = el as SVGElement;
    const defsRef = (el?: Element) => this._defsElement = el as SVGDefsElement;
    const maskRef = (el?: Element) => this._maskPathElement = el as SVGPathElement;
    const slashMaskRef = (el?: Element) => this._slashMaskPathElement = el as SVGPathElement;
    const speakerRef = (el?: Element) => this._speakerPathElement = el as SVGPathElement;
    const hiderRef = (el?: Element) => this._hiderPathElement = el as SVGPathElement;
    const muteRef = (el?: Element) => {
      if (el && el.parentNode && typeof el.parentNode.removeChild === 'function') {
        el.parentNode.removeChild(el);
      }
      
      this._mutePathElement = el as SVGPathElement;
    };

    const hiddenSpace = document.createElement("div");
    render(
      (
        <svg width="100%" height="100%" version="1.1" viewBox="0 0 36 36">
          <path
            ref={muteRef}
            d={ICON_VOLUME_MUTE}
            fill="#ffffff">
          </path>
        </svg>
      ),
      hiddenSpace
    );

    return (
      <button
        class="chrome-mute-button chrome-button"
        onClick={onClick}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          version="1.1"
          viewBox="0 0 36 36">
          <defs ref={defsRef}>
            <clipPath id="chrome-svg-volume-animation-mask">
              <path d="m 14.35,-0.14 -5.86,5.86 20.73,20.78 5.86,-5.91 z"></path>
              <path d="M 7.07,6.87 -1.11,15.33 19.61,36.11 27.80,27.60 z"></path>
              <path
                ref={maskRef}
                class="chrome-svg-volume-animation-mover"
                d="M 9.09,5.20 6.47,7.88 26.82,28.77 29.66,25.99 z"
                transform="translate(0,0)"></path>
            </clipPath>
            <clipPath id="chrome-svg-volume-animation-slash-mask">
              <path
                ref={slashMaskRef}
                class="chrome-svg-volume-animation-mover"
                d="m -11.45,-15.55 -4.44,4.51 20.45,20.94 4.55,-4.66 z"
                transform="translate(0,0)"></path>
            </clipPath>
          </defs>
          <path
            ref={speakerRef}
            d={ICON_VOLUME + " " + ICON_VOLUME_HIGH}
            fill="#ffffff"
            clip-path="url(#chrome-svg-volume-animation-mask)"></path>
          <path
            ref={hiderRef}
            d="M 9.25,9 7.98,10.27 24.71,27 l 1.27,-1.27 Z"
            fill="#ffffff"
            clip-path="url(#chrome-svg-volume-animation-slash-mask)"
            style="display: none;"></path>
        </svg>
      </button>
    );
  }
}
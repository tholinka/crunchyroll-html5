import { h, Component } from "preact";
import { EventHandler } from "../../libs/events/EventHandler";

export interface ICuedThumbnailComponentProps {
  onClick?: Function;
}

export class CuedThumbnailComponent extends Component<ICuedThumbnailComponentProps, {}> {
  private _visible: boolean = false;
  private _url: string = "";

  private _imageElement: HTMLElement;
  private _buttonElement: HTMLElement;

  private _handler = new EventHandler(this);

  private _onTransitionEnd() {
    if (!this._visible) {
      this.base.style.display = "none";
    }
  }

  setThumbnailUrl(url: string): void {
    this._url = url;

    this._imageElement.style.backgroundImage = "url(" + JSON.stringify(url) + ")";

    if (this._visible && !url) {
      this.setVisible(false);
    }
  }

  getThumbnailUrl(): string {
    return this._url;
  }

  setButtonVisible(visible: boolean): void {
    this._buttonElement.style.display = visible ? "" : "none";
    if (visible) {
      this.base.classList.add("html5-video-cued-thumbnail-overlay--actionable")
    } else {
      this.base.classList.remove("html5-video-cued-thumbnail-overlay--actionable")
    }
  }

  setVisible(visible: boolean): void {
    visible = visible && !!this._url;
    if (this._visible === visible) return;
    this._visible = visible;

    this.base.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  isVisible(): boolean {
    return this._visible;
  }

  componentDidMount(): void {
    this._handler
      .listen(this.base, 'transitionend', this._onTransitionEnd, false)
      .listen(this.base, 'webkitTransitionEnd', this._onTransitionEnd, false)
      .listen(this.base, 'oTransitionEnd', this._onTransitionEnd, false)
      .listen(this.base, 'otransitionend', this._onTransitionEnd, false)
      .listen(this.base, 'msTransitionEnd', this._onTransitionEnd, false);
  }

  componentWillUnmount(): void {
    this._handler.removeAll();
  }

  render(): JSX.Element {
    const imageRef = (el: HTMLElement) => this._imageElement = el;
    const buttonRef = (el: HTMLElement) => this._buttonElement = el;
    const onClick = () => this.props.onClick && this.props.onClick();
    return (
      <div class="html5-video-cued-thumbnail-overlay" onClick={onClick}>
        <div class="html5-video-cued-thumbnail-overlay-image" ref={imageRef}></div>
        <button class="chrome-large-play-button chrome-button" style="display: none" aria-label="Play" ref={buttonRef}>
          <svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%">
            <path class="chrome-large-play-button-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#212121" fill-opacity="0.8"></path>
            <path d="M 45,24 27,14 27,34" fill="#fff"></path>
          </svg>
        </button>
      </div>
    );
  }
}
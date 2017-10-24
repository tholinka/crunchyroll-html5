import { h, Component } from "preact";
import { EventHandler } from "../../libs/events/EventHandler";

export class CuedThumbnailComponent extends Component<{}, {}> {
  private _visible: boolean = false;
  private _url: string = "";

  private _containerElement: HTMLElement;
  private _imageElement: HTMLElement;

  private _handler = new EventHandler(this);

  private _onTransitionEnd() {
    if (!this._visible) {
      this._containerElement.style.display = "none";
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

  setVisible(visible: boolean): void {
    visible = visible && !!this._url;
    if (this._visible === visible) return;
    this._visible = visible;

    if (visible) {
      this._containerElement.style.display = "";
      this._containerElement.style.opacity = '1';
    } else {
      this._containerElement.style.opacity = '0';
    }
  }

  isVisible(): boolean {
    return this._visible;
  }

  componentDidMount(): void {
    this._handler
      .listen(this._containerElement, 'transitionend', this._onTransitionEnd, false)
      .listen(this._containerElement, 'webkitTransitionEnd', this._onTransitionEnd, false)
      .listen(this._containerElement, 'oTransitionEnd', this._onTransitionEnd, false)
      .listen(this._containerElement, 'otransitionend', this._onTransitionEnd, false)
      .listen(this._containerElement, 'msTransitionEnd', this._onTransitionEnd, false);
  }

  componentWillUnmount(): void {
    this._handler.removeAll();
  }

  render(): JSX.Element {
    const containerRef = (el: HTMLElement) => this._containerElement = el;
    const imageRef = (el: HTMLElement) => this._imageElement = el;
    return (
      <div class="html5-video-cued-thumbnail-overlay" ref={containerRef}>
        <div class="html5-video-cued-thumbnail-overlay-image" ref={imageRef}></div>
      </div>
    );
  }
}
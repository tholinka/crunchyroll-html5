import { Component, h, render } from 'preact';
import { EventHandler } from '../../../libs/events/EventHandler';

export class BezelComponent extends Component<{}, {}> {
  private _handler: EventHandler = new EventHandler(this);
  private _iconElement?: Element;

  public componentDidMount() {
    this._handler
      .listen(this.base, 'animationend', this._handleAnimationEnd, false)
      .listen(this.base, 'webkitAnimationEnd', this._handleAnimationEnd, false)
      .listen(this.base, 'MSAnimationEnd', this._handleAnimationEnd, false)
      .listen(this.base, 'oAnimationEnd', this._handleAnimationEnd, false);
  }

  public componentWillUnmount() {
    this._handler.removeAll();
  }

  public playSvgPath(d: string): void {
    const el = (
      <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
        <path fill="#ffffff" d={d} />
      </svg>
    );

    this._play(el);
  }

  public stop(): void {
    this.base.style.display = 'none';
  }

  public render(): JSX.Element {
    const iconRef = (el?: Element) => (this._iconElement = el);
    return (
      <div class="chrome-bezel" role="status" style="display: none">
        <div class="chrome-bezel-icon" ref={iconRef} />
      </div>
    );
  }

  private _play(element: JSX.Element): void {
    this.stop();

    if (this._iconElement) {
      this._iconElement.innerHTML = '';
      render(element, this._iconElement);
    }

    // Trigger reflow
    // tslint:disable-next-line:no-unused-expression
    void this.base.offsetWidth;

    // Display bezel animation
    this.base.style.display = '';
  }

  private _handleAnimationEnd() {
    this.stop();
  }
}

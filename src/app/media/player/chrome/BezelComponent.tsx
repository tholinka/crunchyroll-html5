import { h, Component, render } from "preact";
import { EventHandler } from "../../../libs/events/EventHandler";

export class BezelComponent extends Component<{}, {}> {
  private _handler: EventHandler = new EventHandler(this);
  private _iconElement: HTMLElement;

  private _handleAnimationEnd() {
    this.stop();
  }

  componentDidMount() {
    this._handler
      .listen(this.base, 'animationend', this._handleAnimationEnd, false)
      .listen(this.base, 'webkitAnimationEnd', this._handleAnimationEnd, false)
      .listen(this.base, 'MSAnimationEnd', this._handleAnimationEnd, false)
      .listen(this.base, 'oAnimationEnd', this._handleAnimationEnd, false);
  }

  componentWillUnmount() {
    this._handler.removeAll();
  }

  play(element: JSX.Element): void {
    this.stop();

    this._iconElement.innerHTML = "";
    render(element, this._iconElement);

    // Trigger reflow
    void this.base.offsetWidth;

    // Display bezel animation
    this.base.style.display = "";
  }

  playSvgPath(d: string): void {
    const el = (
      <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
        <path fill="#ffffff" d={d}></path>
      </svg>
    );

    this.play(el);
  }

  stop(): void {
    this.base.style.display = "none";
  }

  render(): JSX.Element {
    const iconRef = (el: HTMLElement) => this._iconElement = el;
    return (
      <div class="chrome-bezel" role="status" style="display: none">
        <div class="chrome-bezel-icon" ref={iconRef}></div>
      </div>
    );
  }
}
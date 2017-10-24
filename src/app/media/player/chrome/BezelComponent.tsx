import { h, Component, render } from "preact";
import { requestAnimationFrame, cancelAnimationFrame } from '../../../utils/animation';

export class BezelComponent extends Component<{}, {}> {
  private _iconElement: HTMLElement;
  private _frameId: number;

  play(element: JSX.Element): void {
    this.stop();

    cancelAnimationFrame(this._frameId);
    this._frameId = requestAnimationFrame(() => {
      this._iconElement.innerHTML = "";
      render(element, this._iconElement);

      this.base.style.display = "";
    });
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
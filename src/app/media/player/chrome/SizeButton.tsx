import { h, Component } from "preact";
import { SvgPathMorphAnimation } from "../../../libs/animation/SvgPathMorphAnimation";
import { IPlayerApi, PlaybackState } from "../IPlayerApi";
import { EventHandler } from "../../../libs/events/EventHandler";

const SMALL_PATH = "m 26,13 0,10 -16,0 0,-10 z m -14,2 12,0 0,6 -12,0 0,-6 z";
const LARGE_PATH = "m 28,11 0,14 -20,0 0,-14 z m -18,2 16,0 0,10 -16,0 0,-10 z";

export interface ISizeButtonProps {
  api: IPlayerApi;
  onHover?: () => void;
  onEndHover?: () => void;
}

export class SizeButton extends Component<ISizeButtonProps, {}> {
  private _handler = new EventHandler(this);
  private _pathElement: SVGPathElement;

  private _isLarge() {
    return this.props.api.isLarge();
  }

  private _onClick() {
    this.props.api.setLarge(!this._isLarge());
  }

  private _onSizeChange() {
    const d: string = this._isLarge() ? SMALL_PATH : LARGE_PATH;
    this._pathElement.setAttribute("d", d);
  }
  
  private _onMouseOver() {
    if (this.props.onHover) {
      this.props.onHover();
    }
  }
  
  private _onMouseOut() {
    if (this.props.onEndHover) {
      this.props.onEndHover();
    }
  }

  componentDidMount() {
    this._handler
      .listen(this.props.api, 'sizechange', this._onSizeChange, false)
      .listen(this.base, 'mouseover', this._onMouseOver, { passive: true })
      .listen(this.base, 'mouseout', this._onMouseOut, { passive: true });
  }

  componentWillUnmount() {
    this._handler.removeAll();
  }

  render(): JSX.Element {
    const d: string = this._isLarge() ? SMALL_PATH : LARGE_PATH;

    const onClick = () => this._onClick();
    const pathRef = (element: SVGPathElement) => this._pathElement = element;

    return (
      <button class="chrome-button chrome-size-button" onClick={onClick}>
        <svg width="100%" height="100%" version="1.1" viewBox="0 0 36 36">
          <path d={d} fill-rule="evenodd" fill="#ffffff" ref={pathRef}></path>
        </svg>
      </button>
    );
  }
}
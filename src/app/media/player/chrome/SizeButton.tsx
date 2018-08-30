import { Component, h } from 'preact';
import { EventHandler } from '../../../libs/events/EventHandler';
import { IPlayerApi } from '../IPlayerApi';

const SMALL_PATH = 'm 26,13 0,10 -16,0 0,-10 z m -14,2 12,0 0,6 -12,0 0,-6 z';
const LARGE_PATH = 'm 28,11 0,14 -20,0 0,-14 z m -18,2 16,0 0,10 -16,0 0,-10 z';

export interface ISizeButtonProps {
  api: IPlayerApi;
  visible?: boolean;
  onHover?: () => void;
  onEndHover?: () => void;
}

export class SizeButton extends Component<ISizeButtonProps, {}> {
  private _handler = new EventHandler(this);
  private _pathElement?: SVGPathElement;

  public componentDidMount() {
    if (!this.base) throw new Error('Base is undefined');
    this._handler
      .listen(this.props.api, 'sizechange', this._onSizeChange, false)
      .listen(this.base, 'mouseover', this._onMouseOver, { passive: true })
      .listen(this.base, 'mouseout', this._onMouseOut, { passive: true });
  }

  public componentWillUnmount() {
    this._handler.removeAll();
  }

  public render(): JSX.Element {
    const d: string = this._isLarge() ? SMALL_PATH : LARGE_PATH;

    const onClick = () => this._onClick();
    const pathRef = (element?: Element) =>
      (this._pathElement = element as SVGPathElement);

    const visible =
      typeof this.props.visible === 'boolean' ? this.props.visible : true;
    const className =
      'chrome-button chrome-size-button' +
      (visible ? '' : ' chrome-size-button--hidden');

    return (
      <button class={className} onClick={onClick}>
        <svg width="100%" height="100%" version="1.1" viewBox="0 0 36 36">
          <path d={d} fill-rule="evenodd" fill="#ffffff" ref={pathRef} />
        </svg>
      </button>
    );
  }

  private _isLarge() {
    return this.props.api.isLarge();
  }

  private _onClick() {
    this.props.api.setLarge(!this._isLarge());
  }

  private _onSizeChange() {
    if (!this._pathElement) return;
    const d: string = this._isLarge() ? SMALL_PATH : LARGE_PATH;
    this._pathElement.setAttribute('d', d);
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
}

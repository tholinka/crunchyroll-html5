import { Component, h } from "preact";
import { EventHandler } from "../../../libs/events/EventHandler";
import { IPlayerApi } from "../IPlayerApi";

const ENTER_SVG = (
  <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
    <g class="chrome-fullscreen-btn-corner-0">
      <path fill="#ffffff" d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z" />
    </g>
    <g class="chrome-fullscreen-btn-corner-1">
      <path fill="#ffffff" d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z" />
    </g>
    <g class="chrome-fullscreen-btn-corner-2">
      <path fill="#ffffff" d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z" />
    </g>
    <g class="chrome-fullscreen-btn-corner-3">
      <path fill="#ffffff" d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z" />
    </g>
  </svg>
);
const EXIT_SVG = (
  <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
    <g class="chrome-fullscreen-btn-corner-2">
      <path fill="#ffffff" d="m 14,14 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z" />
    </g>
    <g class="chrome-fullscreen-btn-corner-3">
      <path fill="#ffffff" d="m 22,14 0,-4 -2,0 0,6 6,0 0,-2 -4,0 0,0 z" />
    </g>
    <g class="chrome-fullscreen-btn-corner-0">
      <path fill="#ffffff" d="m 20,26 2,0 0,-4 4,0 0,-2 -6,0 0,6 0,0 z" />
    </g>
    <g class="chrome-fullscreen-btn-corner-1">
      <path fill="#ffffff" d="m 10,22 4,0 0,4 2,0 0,-6 -6,0 0,2 0,0 z" />
    </g>
  </svg>
);

export interface IFullscreenButtonProps {
  api: IPlayerApi;
  onHover?: () => void;
  onEndHover?: () => void;
}

export interface IFullscreenButtonState {
  fullscreen?: boolean;
}

export class FullscreenButton extends Component<IFullscreenButtonProps, IFullscreenButtonState> {
  private _handler = new EventHandler(this);

  constructor() {
    super();
    
    this.state = {
      fullscreen: false
    };
  }

  public componentDidMount() {
    this._handler
      .listen(this.props.api, 'fullscreenchange', this._onFullscreenChange, false)
      .listen(this.base, 'mouseover', this._onMouseOver, { passive: true })
      .listen(this.base, 'mouseout', this._onMouseOut, { passive: true });
  }

  public componentWillUnmount() {
    this._handler.removeAll();
  }

  public render({}: IFullscreenButtonProps, { fullscreen = false }: IFullscreenButtonState): JSX.Element {
    const onClick = () => this._onClick();

    const svg = fullscreen ? EXIT_SVG : ENTER_SVG;

    const attributes: {
      'aria-disabled'?: string
    } = {};
    if (!this._isEnabled()) {
      attributes['aria-disabled'] = "true";
    }

    return (
      <button class="chrome-button chrome-fullscreen-button" onClick={onClick} {...attributes}>
        {svg}
      </button>
    );
  }

  private _isEnabled(): boolean {
    return this.props.api.isFullscreenEnabled();
  }

  private _isFullscreen() {
    return this.props.api.isFullscreen();
  }

  private _onClick() {
    if (this._isEnabled()) {
      this.props.api.toggleFullscreen();
    } else {
      // Show popup to alert the user about the fullscreen mode being disabled.
    }
  }

  private _onFullscreenChange() {
    this.setState({ fullscreen: this._isFullscreen() });
  }
  
  private _onMouseOver() {
    if (!this._isEnabled()) return;

    if (this.props.onHover) {
      this.props.onHover();
    }
  }
  
  private _onMouseOut() {
    if (!this._isEnabled()) return;

    if (this.props.onEndHover) {
      this.props.onEndHover();
    }
  }
}
import { h, Component } from "preact";
import { SvgPathMorphAnimation } from "../../../libs/animation/SvgPathMorphAnimation";
import { IPlayerApi, PlaybackState } from "../IPlayerApi";
import { EventHandler } from "../../../libs/events/EventHandler";

const ENTER_SVG = (
  <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
    <g class="chrome-fullscreen-btn-corner-0">
      <path fill="#ffffff" d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z"></path>
    </g>
    <g class="chrome-fullscreen-btn-corner-1">
      <path fill="#ffffff" d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z"></path>
    </g>
    <g class="chrome-fullscreen-btn-corner-2">
      <path fill="#ffffff" d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z"></path>
    </g>
    <g class="chrome-fullscreen-btn-corner-3">
      <path fill="#ffffff" d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z"></path>
    </g>
  </svg>
);
const EXIT_SVG = (
  <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
    <g class="chrome-fullscreen-btn-corner-2">
      <path fill="#ffffff" d="m 14,14 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z"></path>
    </g>
    <g class="chrome-fullscreen-btn-corner-3">
      <path fill="#ffffff" d="m 22,14 0,-4 -2,0 0,6 6,0 0,-2 -4,0 0,0 z"></path>
    </g>
    <g class="chrome-fullscreen-btn-corner-0">
      <path fill="#ffffff" d="m 20,26 2,0 0,-4 4,0 0,-2 -6,0 0,6 0,0 z"></path>
    </g>
    <g class="chrome-fullscreen-btn-corner-1">
      <path fill="#ffffff" d="m 10,22 4,0 0,4 2,0 0,-6 -6,0 0,2 0,0 z"></path>
    </g>
  </svg>
);

export interface IFullscreenButtonProps {
  api: IPlayerApi
}

export interface IFullscreenButtonState {
  fullscreen?: boolean;
}

export class FullscreenButton extends Component<IFullscreenButtonProps, IFullscreenButtonState> {
  private _handler = new EventHandler(this);

  private _isFullscreen() {
    return this.props.api.isFullscreen();
  }

  private _onClick() {
    this.props.api.toggleFullscreen();
  }

  private _onFullscreenChange() {
    this.setState({ fullscreen: this._isFullscreen() });
  }

  componentDidMount() {
    this._handler
      .listen(this.props.api, 'fullscreenchange', this._onFullscreenChange, false);
  }

  componentWillUnmount() {
    this._handler.removeAll();
  }

  render({}: IFullscreenButtonProps, { fullscreen = false }: IFullscreenButtonState): JSX.Element {
    const onClick = () => this._onClick();

    const svg = fullscreen ? EXIT_SVG : ENTER_SVG;

    return (
      <button class="chrome-controls-button chrome-fullscreen-button" onClick={onClick}>
        {svg}
      </button>
    );
  }
}
import { Component, h } from 'preact';
import { EventHandler } from '../../../libs/events/EventHandler';
import { IPlayerApi } from '../IPlayerApi';

export interface ISettingsButtonProps {
  api: IPlayerApi;
  onHover?: () => void;
  onEndHover?: () => void;
}

export class SettingsButton extends Component<ISettingsButtonProps, {}> {
  private _handler = new EventHandler(this);

  private _pathElement?: SVGPathElement;
  private _svgElement?: SVGElement;

  public componentDidMount() {
    this._handler
      .listen(
        this.props.api,
        'settingsopen',
        () => this._onSettingsToggle(true),
        false
      )
      .listen(
        this.props.api,
        'settingsclose',
        () => this._onSettingsToggle(false),
        false
      )
      .listen(this.base, 'mouseover', this._onMouseOver, { passive: true })
      .listen(this.base, 'mouseout', this._onMouseOut, { passive: true });
  }

  public componentWillUnmount() {
    this._handler.removeAll();
  }

  public render(): JSX.Element {
    const onClick = () => this._onClick();

    const pathRef = (element?: Element) =>
      (this._pathElement = element as SVGPathElement);
    const svgRef = (element?: Element) =>
      (this._svgElement = element as SVGElement);

    return (
      <button class="chrome-button chrome-settings-button" onClick={onClick}>
        <svg
          width="100%"
          height="100%"
          version="1.1"
          viewBox="0 0 36 36"
          ref={svgRef}>
          <path
            d="m 23.94,18.78 c .03,-0.25 .05,-0.51 .05,-0.78 0,-0.27 -0.02,-0.52 -0.05,-0.78 l 1.68,-1.32 c .15,-0.12 .19,-0.33 .09,-0.51 l -1.6,-2.76 c -0.09,-0.17 -0.31,-0.24 -0.48,-0.17 l -1.99,.8 c -0.41,-0.32 -0.86,-0.58 -1.35,-0.78 l -0.30,-2.12 c -0.02,-0.19 -0.19,-0.33 -0.39,-0.33 l -3.2,0 c -0.2,0 -0.36,.14 -0.39,.33 l -0.30,2.12 c -0.48,.2 -0.93,.47 -1.35,.78 l -1.99,-0.8 c -0.18,-0.07 -0.39,0 -0.48,.17 l -1.6,2.76 c -0.10,.17 -0.05,.39 .09,.51 l 1.68,1.32 c -0.03,.25 -0.05,.52 -0.05,.78 0,.26 .02,.52 .05,.78 l -1.68,1.32 c -0.15,.12 -0.19,.33 -0.09,.51 l 1.6,2.76 c .09,.17 .31,.24 .48,.17 l 1.99,-0.8 c .41,.32 .86,.58 1.35,.78 l .30,2.12 c .02,.19 .19,.33 .39,.33 l 3.2,0 c .2,0 .36,-0.14 .39,-0.33 l .30,-2.12 c .48,-0.2 .93,-0.47 1.35,-0.78 l 1.99,.8 c .18,.07 .39,0 .48,-0.17 l 1.6,-2.76 c .09,-0.17 .05,-0.39 -0.09,-0.51 l -1.68,-1.32 0,0 z m -5.94,2.01 c -1.54,0 -2.8,-1.25 -2.8,-2.8 0,-1.54 1.25,-2.8 2.8,-2.8 1.54,0 2.8,1.25 2.8,2.8 0,1.54 -1.25,2.8 -2.8,2.8 l 0,0 z"
            fill-rule="evenodd"
            fill="#ffffff"
            ref={pathRef}
          />
        </svg>
      </button>
    );
  }

  private _onClick() {
    if (this.props.api.isSettingsOpen()) {
      this.props.api.closeSettings();
    } else {
      this.props.api.openSettings();
    }
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

  private _onSettingsToggle(open: boolean) {
    if (!this._svgElement) return;
    this._svgElement.style.transform = `rotateZ(${
      this.props.api.isSettingsOpen() ? 30 : 0
    }deg)`;
  }
}

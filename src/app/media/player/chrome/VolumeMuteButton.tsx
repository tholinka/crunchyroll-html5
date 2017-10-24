import { h, Component } from "preact";
import { IPlayerApi } from "../IPlayerApi";
import { EventHandler } from "../../../libs/events/EventHandler";

export interface IVolumeMuteButtonProps {
  api: IPlayerApi
}

export class VolumeMuteButton extends Component<IVolumeMuteButtonProps, {}> {
  private _handler: EventHandler = new EventHandler(this);

  private _onClick(): void {
    const api = this.props.api;
    if (api.isMuted()) {
      api.unmute();
    } else {
      api.mute();
    }
  }

  private _onVolumeChange() {

  }

  componentDidMount() {
    this._handler
      .listen(this.props.api, 'volumechange', this._onVolumeChange, false);
  }

  componentWillUnmount() {
    this._handler.removeAll();
  }

  render(): JSX.Element {
    const onClick = () => this._onClick();
    return (
      <button
        class="chrome-mute-button chrome-button"
        onClick={onClick}>
      
      </button>
    );
  }
}
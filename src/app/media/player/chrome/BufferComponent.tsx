import { h, Component } from "preact";
import { IPlayerApi, PlaybackState } from "../IPlayerApi";
import { EventHandler } from "../../../libs/events/EventHandler";

export interface IBufferComponentProps {
  api: IPlayerApi;
}

export interface IBufferComponentState {
  visible: boolean;
}

export class BufferComponent extends Component<IBufferComponentProps, IBufferComponentState> {
  private _handler: EventHandler = new EventHandler(this);

  private _timer?: number;
  private _visibilityDelay: number = 1000;

  constructor() {
    super();

    this.state = {
      visible: false
    };
  }

  private _onPlaybackStateChange() {
    const api = this.props.api;

    const state = api.getPlaybackState();
    window.clearTimeout(this._timer);
    if (state === PlaybackState.BUFFERING) {
      this._timer = window.setTimeout(() => {
        this.setState({
          visible: true
        });
      }, this._visibilityDelay);
    } else {
      this.setState({
        visible: false
      });
    }
  }

  componentDidMount() {
    this._handler
      .listen(this.props.api, 'playbackstatechange', this._onPlaybackStateChange, false);
  }

  componentWillUnmount() {
    this._handler.removeAll();
  }

  render({}: IBufferComponentProps, { visible }: IBufferComponentState): JSX.Element {
    const props: {[key: string]: string} = {};
    if (!visible) {
      props["style"] = "display: none";
    }

    return (
      <div class="chrome-spinner" {...props}>
        <div>
          <div class="chrome-spinner-container">
            <div class="chrome-spinner-rotator">
              <div class="chrome-spinner-left">
                <div class="chrome-spinner-circle"></div>
              </div>
              <div class="chrome-spinner-right">
                <div class="chrome-spinner-circle"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
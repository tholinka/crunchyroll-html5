import { h, Component } from "preact";
import { IPlayerApi, PlaybackState } from "../IPlayerApi";
import { EventHandler } from "../../../libs/events/EventHandler";

export interface IBufferComponentProps {
  api: IPlayerApi;
}

export class BufferComponent extends Component<IBufferComponentProps, {}> {
  private _handler: EventHandler = new EventHandler(this);

  private _timer: number;
  private _visibilityDelay: number = 1000;

  private _onPlaybackStateChange() {
    const api = this.props.api;

    const state = api.getPlaybackState();
    window.clearTimeout(this._timer);
    if (state === PlaybackState.BUFFERING) {
      this._timer = window.setTimeout(() => {
        this.base.style.display = "";
      }, this._visibilityDelay);
    } else {
      this.base.style.display = "none";
    }
  }

  componentDidMount() {
    this._handler
      .listen(this.props.api, 'playbackstatechange', this._onPlaybackStateChange, false);
  }

  componentWillUnmount() {
    this._handler.removeAll();
  }

  render(): JSX.Element {
    return (
      <div class="chrome-spinner" style="display: none">
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
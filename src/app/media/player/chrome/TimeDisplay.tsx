import { IPlayerApi, DurationChangeEvent, TimeUpdateEvent } from "../IPlayerApi";
import { h, Component } from "preact";
import { EventHandler } from "../../../libs/events/EventHandler";
import { parseAndFormatTime } from "../../../utils/time";

export interface ITimeDisplayProps {
  api: IPlayerApi
}

export class TimeDisplay extends Component<ITimeDisplayProps, {}> {
  private _currentTimeElement?: Element;
  private _durationTimeElement?: Element;

  private _handler: EventHandler = new EventHandler(this);

  private _currentTime: number = NaN;
  private _duration: number = NaN;

  private _onTimeUpdate(e: TimeUpdateEvent) {
    this._currentTime = e.time;
    this._updateState();
  }
  
  private _onDurationChange(e: DurationChangeEvent) {
    this._duration = e.duration;
    this._updateState();
  }

  private _updateState() {
    if (!this._currentTimeElement || !this._durationTimeElement) return;

    const currentTime = this._currentTime;
    const duration = this._duration;

    if (isNaN(currentTime)) {
      this._currentTimeElement.textContent = '--:--';
    } else {
      this._currentTimeElement.textContent = parseAndFormatTime(currentTime);
    }
    if (isNaN(duration)) {
      this._durationTimeElement.textContent = '--:--';
    } else {
      this._durationTimeElement.textContent = parseAndFormatTime(duration);
    }
  }

  componentDidMount() {
    this._handler
      .listen(this.props.api, 'timeupdate', this._onTimeUpdate, false)
      .listen(this.props.api, 'durationchange', this._onDurationChange, false);
  }

  componentWillUnmount() {
    this._handler.removeAll();
  }

  render(props: ITimeDisplayProps): JSX.Element {
    const currentRef = (el?: Element) => this._currentTimeElement = el;
    const durationRef = (el?: Element) => this._durationTimeElement = el;

    this._currentTime = props.api.getCurrentTime();
    this._duration = props.api.getDuration();

    return (
      <div class="chrome-time-display">
        <span class="chrome-time-current" ref={currentRef}>--:--</span>
        <span class="chrome-time-separator"> / </span>
        <span class="chrome-time-duration" ref={durationRef}>--:--</span>
      </div>
    );
  }
}
import { h, Component } from "preact";
import { vendorPrefix } from "../../../utils/style";
import { IPlayerApi, TimeUpdateEvent, DurationChangeEvent } from "../IPlayerApi";
import { EventHandler } from "../../../libs/events/EventHandler";
import { parseAndFormatTime } from "../../../utils/time";
import { BrowserEvent } from "../../../libs/events/BrowserEvent";

export interface IChromeProgressBarProps {
  api: IPlayerApi;
  onHover: (time: number, percentage: number) => void;
  onEndHover: () => void;
}

export class ChromeProgressBarComponent extends Component<IChromeProgressBarProps, {}> {
  private _containerElement: HTMLElement;
  private _progressBarElement: HTMLElement;
  private _scrubberElement: HTMLElement;
  private _playElement: HTMLElement;
  private _loadElement: HTMLElement;
  private _hoverElement: HTMLElement;

  private _width: number = 0;
  private _left: number = 0;
  private _handler = new EventHandler(this);

  private _dragging: boolean = false;

  private _duration: number = 0;
  private _playTime: number = 0;
  private _loadTime: number = 0;
  private _hoverTime: number = 0;

  private _visibility: boolean = false;

  setInternalVisibility(visibility: boolean) {
    this._visibility = visibility;
    if (this._visibility) {
      this._updateState();
    }
  }

  private _onDurationChange(e: DurationChangeEvent) {
    this._duration = e.duration;
    this._updateState();
  }

  private _onTimeUpdate(e: TimeUpdateEvent) {
    this._playTime = e.time;
    this._updateState();
  }

  private _onResize() {
    const rect = this._containerElement.getBoundingClientRect();
    this._width = rect.width;
    this._left = rect.left;
  }
  
  private _onMouseDown(e: BrowserEvent) {
    if (e.button !== 0 || this._dragging) return;
    e.preventDefault();
    this._dragging = true;

    this._onMouseMove(e);
  }
  
  private _onMouseMove(e: BrowserEvent) {
    if (!this._dragging && e.target !== this._containerElement && !this._containerElement.contains(e.target as Node)) return;

    const left = Math.max(Math.min(e.clientX - this._left, this._width), 0);

    const percentage = left/this._width;

    const time = percentage*this._duration;

    this.props.onHover(time, percentage);

    this._hoverTime = time;

    if (this._dragging) {
      this._playTime = time;
      this.props.api.setForcePaused(true);
      this.props.api.seekTo(time);
    }
    this._updateState();
  }
  
  private _onMouseUp(e: BrowserEvent) {
    if (e.button !== 0 || !this._dragging) return;
    this._dragging = false;

    this.props.api.setForcePaused(false);

    if (e.target !== this._containerElement && !this._containerElement.contains(e.target as Node)) {
      this.props.onEndHover();
    }
  }

  private _onMouseEnter(e: BrowserEvent) {
    const left = Math.max(Math.min(e.clientX - this._left, this._width), 0);
    const percentage = left/this._width;
    const time = percentage*this._duration;

    this.props.onHover(time, left);
  }

  private _onMouseLeave(e: BrowserEvent) {
    this._hoverTime = 0;
    this._updateState();
    this.props.onEndHover();
  }

  private _onProgress() {
    this._loadTime = this.props.api.getBufferedTime();
    this._updateState();
  }
  
  private _updateState() {
    if (!this._visibility) return;
    const playPercentage = this._duration === 0 ? 0 : this._playTime/this._duration;
    const loadPercentage = this._duration === 0 ? 0 : this._loadTime/this._duration;
    const hoverPercentage = this._duration === 0 ? 0 : this._hoverTime/this._duration;

    const scrubberStyle = vendorPrefix('transform', 'translateX(' + this._width*playPercentage + 'px)');
    const playStyle = "left: 0;" + vendorPrefix('transform', 'scaleX(' + playPercentage + ')');
    const loadStyle = "left: 0;" + vendorPrefix('transform', 'scaleX(' + loadPercentage + ')');
    const hoverStyle = "left: " + this._width*playPercentage + "px;"
      + vendorPrefix('transform', 'scaleX(' + Math.max(hoverPercentage - playPercentage, 0) + ')');

    this._scrubberElement.setAttribute("style", scrubberStyle);
    this._playElement.setAttribute("style", playStyle);
    this._loadElement.setAttribute("style", loadStyle);
    this._hoverElement.setAttribute("style", hoverStyle);

    this._progressBarElement.setAttribute("aria-valuemin", "0");
    this._progressBarElement.setAttribute("aria-valuemax", this._duration + '');
    this._progressBarElement.setAttribute("aria-valuenow", this._playTime + '');
    this._progressBarElement.setAttribute("aria-valuetext", parseAndFormatTime(this._playTime) + " of " + parseAndFormatTime(this._duration));
  }

  componentDidMount() {
    const rect = this._containerElement.getBoundingClientRect();
    this._width = rect.width;
    this._left = rect.left;

    this._handler
      .listen(this._containerElement, 'mousedown', this._onMouseDown, false)
      .listen(document, 'mousemove', this._onMouseMove, { passive: true })
      .listen(document, 'mouseup', this._onMouseUp, false)
      .listen(this._containerElement, 'mouseenter', this._onMouseEnter, { passive: true })
      .listen(this._containerElement, 'mouseleave', this._onMouseLeave, { passive: true })
      .listen(this.props.api, 'durationchange', this._onDurationChange, false)
      .listen(this.props.api, 'timeupdate', this._onTimeUpdate, false)
      .listen(this.props.api, 'progress', this._onProgress, false)
      .listen(this.props.api, 'resize', this._onResize, false);
    this._updateState();
  }
  
  componentWillUnmount() {
    this._handler.removeAll();
  }

  render(): JSX.Element {
    const containerRef = (el: HTMLElement) => this._containerElement = el;
    const progressBarRef = (el: HTMLElement) => this._progressBarElement = el;
    const scrubberRef = (el: HTMLElement) => this._scrubberElement = el;
    const playRef = (el: HTMLElement) => this._playElement = el;
    const loadRef = (el: HTMLElement) => this._loadElement = el;
    const hoverRef = (el: HTMLElement) => this._hoverElement = el;

    return (
      <div class="chrome-progress-bar-container" ref={containerRef}>
        <div
          ref={progressBarRef}
          class="chrome-progress-bar"
          role="slider"
          aria-label="Seek slider"
          aria-valuemin={0}
          aria-valuemax={this._duration}
          aria-valuenow={this._playTime}
          aria-valuetext={parseAndFormatTime(this._playTime) + " of " + parseAndFormatTime(this._duration)}
          draggable={true}
        >
          <div class="chrome-progress-bar-padding"></div>
          <div class="chrome-progress-list">
            <div class="chrome-play-progress chrome-swatch-background-color" ref={playRef}></div>
            <div class="chrome-load-progress" ref={loadRef}></div>
            <div class="chrome-hover-progress chrome-hover-progress--light" ref={hoverRef}></div>
          </div>
          <div class="chrome-scrubber-container" ref={scrubberRef}>
            <div class="chrome-scrubber-button chrome-swatch-background-color">
              <div class="chrome-scrubber-pull-indicator">
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
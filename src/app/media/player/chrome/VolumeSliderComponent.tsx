import { h, Component } from "preact";
import { IPlayerApi, VolumeChangeEvent } from "../IPlayerApi";
import { EventHandler } from "../../../libs/events/EventHandler";
import { BrowserEvent } from "../../../libs/events/BrowserEvent";
import { IRect } from "../../../utils/rect";

export interface IVolumeSliderComponentProps {
  api: IPlayerApi;
  onFocus: () => void;
  onBlur: () => void;
}

export class VolumeSliderComponent extends Component<IVolumeSliderComponentProps, {}> {
  private _handler: EventHandler = new EventHandler(this);

  private _dragging: boolean = false;
  private _incrementValue: number = 1;

  private _minValue: number;
  private _maxValue: number;
  private _value?: number;
  private _muted: boolean;

  private _sliderElement?: Element;
  private _handleElement?: HTMLElement;

  private _sliderRect?: IRect;
  private _handleWidth?: number;
  private _sliderWidth?: number;

  constructor(props: IVolumeSliderComponentProps) {
    super(props);

    this._minValue = 0;
    this._maxValue = 1;
    this._incrementValue = 0.01;
    const volume = props.api.getVolume();
    if (isFinite(volume)) {
      this._value = volume;
    }
    this._muted = props.api.isMuted();
  }

  private _onVolumeChange(e: VolumeChangeEvent): void {
    this._value = e.volume;
    this._muted = e.muted;

    this._updateInternal();
  }

  private _onMouseDown(e: BrowserEvent): void {
    if (this._dragging || e.button !== 0) return;
    this._dragging = true;
    this.base.focus();

    this._onMouseMove(e);
  }

  private _onMouseMove(e: BrowserEvent): void {
    if (!this._dragging || !this._sliderRect || !this._sliderWidth) return;
    e.preventDefault();

    const { left } = this._sliderRect;
    const width = this._sliderWidth;
    const percentage = Math.max(Math.min(e.clientX - left, width), 0)/width;

    const minValue = this.getMinValue();
    const maxValue = this.getMaxValue();

    this.setValue(percentage*(maxValue - minValue) + minValue);
  }

  private _onMouseUp(e: BrowserEvent) {
    if (!this._dragging || e.button !== 0) return;
    e.preventDefault();
    this._dragging = false;
  }

  private _onKeyDown(e: BrowserEvent): void {
    switch (e.keyCode) {
      // End
      case 35:
        this.setValue(this.getMaxValue());
        break;

      // Home
      case 36:
        this.setValue(this.getMinValue());
        break;

      // Left arrow
      // Down arrow
      case 37:
      case 40: {
        const value = Math.min(
          Math.max(
            this.getMinValue(), this.getValue() - this._incrementValue
          ),
          this.getMaxValue()
        );

        this.setValue(value);

        break;
      }

      // Up arrow
      // Right arrow
      case 38:
      case 39: {
        const value = Math.min(
          Math.max(
            this.getMinValue(), this.getValue() + this._incrementValue
          ),
          this.getMaxValue()
        );

        this.setValue(value);
        break;
      }

      default:
        return;
    }
    e.stopPropagation();
    e.preventDefault();
  }

  private _onResize(): void {
    if (!this._sliderElement || !this._handleElement) return;

    this._sliderRect = this._sliderElement.getBoundingClientRect();
    this._handleWidth = this._handleElement.offsetWidth;

    // Hard coded these values as offsetWidth can't be used due to it animating.
    this._sliderWidth = this._handleWidth === 12 ? 52 : 78;

    this._updateInternal();
  }

  private _updateInternal(): void {
    if (!this._handleElement || this._sliderWidth === undefined || this._handleWidth === undefined) return;
    let value: number = this.getValue();
    const minValue: number = this.getMinValue();
    const maxValue: number = this.getMaxValue();

    if (this._muted) {
      value = minValue;
    }

    this.base.setAttribute("aria-valuemin", (minValue * 100) + '');
    this.base.setAttribute("aria-valuemax", (maxValue * 100) + '');

    this.base.setAttribute("aria-valuenow", (value * 100) + '');
    this.base.setAttribute("aria-valuetext", (value * 100) + '% volume');

    const width = this._sliderWidth - this._handleWidth;
    const percentage = (value - minValue)/(maxValue - minValue);

    this._handleElement.style.left = (percentage * width) + 'px';
  }

  getValue(): number {
    if (!this._value) return 0;
    return this._value;
  }

  getMinValue(): number {
    return this._minValue;
  }

  getMaxValue(): number {
    return this._maxValue;
  }

  setValue(value: number, internal: boolean = false): void {
    if (this._value === value) return; // No need to update
    if (value < this.getMinValue() ||value > this.getMaxValue())
      throw new RangeError("Value is out of bounds.");
    this._value = value;

    this.props.api.setVolume(value);
    if (this.props.api.isMuted()) {
      this.props.api.unmute();
    }
  }

  setMinValue(minValue: number, internal: boolean = false): void {
    if (this._minValue === minValue) return;
    const maxValue = this.getMaxValue();
    if (minValue >= maxValue)
      throw new RangeError("Minimum value can't be bigger than or equal to the maximum value.");

    this._minValue = minValue;

    // Restrain value if it's outside bounds.
    this.setValue(Math.min(Math.max(minValue, this.getValue()), maxValue), true);
  }

  setMaxValue(maxValue: number, internal: boolean = false): void {
    if (this._maxValue === maxValue) return;
    const minValue = this.getMinValue();
    if (maxValue <= minValue)
      throw new RangeError("Maximum value can't be less than or equal to the minimum value.");

    this._maxValue = maxValue;
    
    // Restrain value if it's outside bounds.
    this.setValue(Math.min(Math.max(minValue, this.getValue()), maxValue), true);
  }

  componentDidMount() {
    this._handler
      .listen(this.base, 'mousedown', this._onMouseDown, false)
      .listen(document, 'mousemove', this._onMouseMove, false)
      .listen(document, 'mouseup', this._onMouseUp, false)
      .listen(this.base, 'keydown', this._onKeyDown, false)
      .listen(this.props.api, 'volumechange', this._onVolumeChange, false)
      .listen(this.props.api, 'resize', this._onResize, false);

    this._value = this.props.api.getVolume();
    this._muted = this.props.api.isMuted();
    this._onResize();
  }

  componentWillUnmount() {
    this._handler.removeAll();
  }

  render(props: IVolumeSliderComponentProps): JSX.Element {
    const sliderRef = (el?: Element) => this._sliderElement = el;
    const handleRef = (el?: Element) => this._handleElement = el as HTMLElement;

    const attributes = {
      'tabindex': '0'
    };
    return (
      <div
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        class="chrome-volume-panel"
        role="slider"
        {...attributes}>
        <div
          ref={sliderRef}
          class="chrome-volume-slider"
          draggable={true}
          style="touchAction: none;">
          <div
            ref={handleRef}
            class="chrome-volume-slider-handle"></div>
        </div>
      </div>
    );
  }
}
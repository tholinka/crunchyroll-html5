import { EventTarget } from '../../events/eventtarget';
import { EventHandler } from '../../events/eventhandler';

export class VolumeSlider extends EventTarget {
  private element: HTMLElement;
  private sliderElement: HTMLElement;
  private sliderHandleElement: HTMLElement;

  private handler: EventHandler = new EventHandler(this);

  private incrementValue: number = 1;

  private dragging: boolean = false;
  private _bigMode: boolean = false;

  constructor(
    private value: number = 0,
    private minValue: number = 0,
    private maxValue: number = 100
  ) {
    super();

    this.createDom();
    this.enterDocument();

    this.updateDom();
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.handler.dispose();
    this.handler = null;
  }

  protected exitDocument() {
    this.handler.clear();
  }

  protected enterDocument() {
    this.handler
      .listen(this.element, 'keydown', this.handleKeyDown)
      .listen(this.element, 'mousedown', this.handleMouseDown)
      .listen(document, 'mousemove', this.handleMouseMove)
      .listen(document, 'mouseup', this.handleMouseUp);
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.dragging || e.button !== 0) return;
    this.element.focus();
    e.preventDefault();
    this.dragging = true;

    this.handleMouseMove(e);
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.dragging) return;
    e.preventDefault();

    const { left, width } = this.sliderElement.getBoundingClientRect();

    var percentage = Math.max(Math.min(e.clientX - left, width), 0)/width;
    
    this.setValue(percentage*(this.maxValue - this.minValue) + this.minValue);

    this.dispatchEvent('change', this.value);
  }

  private handleMouseUp(e: MouseEvent) {
    if (!this.dragging || e.button !== 0) return;
    e.preventDefault();
    this.dragging = false;

    this.handleMouseMove(e);
  }

  private handleKeyDown(e: KeyboardEvent) {
    switch (e.keyCode) {
      // End
      case 35:
        e.preventDefault();
        e.stopPropagation();
        this.setValue(this.maxValue);
        break;
      // Home
      case 36:
        e.preventDefault();
        e.stopPropagation();
        this.setValue(this.minValue);
        break;
      // Left arrow
      case 37:
        e.preventDefault();
        e.stopPropagation();

        var value = Math.min(Math.max(this.minValue, this.value
          + this.incrementValue), this.maxValue);
        this.setValue(value);
        break;
      // Right arrow
      case 39:
        e.preventDefault();
        e.stopPropagation();

        var value = Math.min(Math.max(this.minValue, this.value
          - this.incrementValue), this.maxValue);
        this.setValue(value);
        break;
    }
  }

  protected createDom() {
    this.element = document.createElement("div");
    this.element.className = "html5-player-volume-panel";
    this.element.setAttribute("role", "slider");
    this.element.setAttribute("tabindex", "0");

    this.sliderElement = document.createElement("div");
    this.sliderElement.className = "html5-player-volume-slider";
    this.sliderElement.setAttribute("draggable", "true");
    this.sliderElement.style.touchAction = "none";

    this.sliderHandleElement = document.createElement("div");
    this.sliderHandleElement.className = "html5-player-volume-slider__handle";

    this.sliderElement.appendChild(this.sliderHandleElement);

    this.element.appendChild(this.sliderElement);

    this.updateDom();
  }

  protected getValueText(): string {
    return this.value + "%";
  }

  private getSliderWidth(): number {
    if (this._bigMode) {
      return 78;
    } else {
      return 52;
    }
  }

  private getSliderHandleWidth(): number {
    if (this._bigMode) {
      return 18;
    } else {
      return 12;
    }
  }

  setBigMode(bigMode: boolean) {
    this._bigMode = bigMode;

    this.updateDom();
  }

  getElement(): Element {
    return this.element;
  }

  updateDom() {
    this.element.setAttribute("aria-valuemin", this.minValue + '');
    this.element.setAttribute("aria-valuemax", this.maxValue + '');

    this.element.setAttribute("aria-valuenow", this.value + '');
    this.element.setAttribute("aria-valuetext", this.getValueText());

    var sliderWidth: number = this.getSliderWidth();
    var handleWidth: number = this.getSliderHandleWidth();

    var width: number = sliderWidth - handleWidth;
    var percentage: number = (this.value - this.minValue)/(this.maxValue - this.minValue);

    this.sliderHandleElement.style.left = (percentage*width) + "px";
  }

  setValue(value: number) {
    if (this.value === value) return;
    if (value < this.minValue || value > this.maxValue)
      throw new Error("The value can't be outside the range.");
    this.value = value;

    this.updateDom();
  }

  setMinValue(minValue: number) {
    if (minValue > this.maxValue)
      throw new Error("The minimum value can't be less than the maximum value.");
    this.minValue = minValue;

    this.value = Math.min(Math.max(this.minValue, this.value), this.maxValue);

    this.updateDom();
  }

  setMaxValue(maxValue: number) {
    if (maxValue < this.minValue)
      throw new Error("The maximum value can't be less than the minimum value.");
    this.maxValue = maxValue;

    this.value = Math.min(Math.max(this.minValue, this.value), this.maxValue);

    this.updateDom();
  }
}
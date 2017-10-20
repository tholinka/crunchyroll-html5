import { EventTarget } from '../../events/eventtarget';
import { EventHandler } from '../../events/eventhandler';

import { parseAndFormatTime } from '../../utils/time';
import * as _ from 'lodash';
import { getOffsetRect, IRect } from '../../utils/offset';

export interface IHover {
  x: number;
  y: number;
  time: number;
}

export class ProgressBarElement extends EventTarget {
  private element: Element;
  private paddingElement: HTMLElement;
  private progressElement: HTMLElement;
  private bufferingElement: HTMLElement;
  private hoverElement: HTMLElement;

  private scrubberElement: HTMLElement;

  private minValue: number = 0;
  private maxValue: number = 0;
  private value: number = 0;
  private bufferingValue: number = 0;

  private handler: EventHandler = new EventHandler(this);

  private _dragging: boolean = false;
  private _outside: boolean = true;

  private _updateDom: boolean = false;

  private _dragThrottled: Function;

  constructor(private playerElement: HTMLElement) {
    super();

    this._dragThrottled = _.throttle(() => this.dispatchEvent('drag', this.value), 100);

    this.createDom();

    this.handler
      .listen(document, "mouseup", this.handleGlobalMouseUp)
      .listen(document, "mousemove", this.handleGlobalMouseMove)
      .listen(this.element, "mousedown", this.handleMouseDown)
      .listen(this.element, "mouseenter", this.handleMouseEnter)
      .listen(this.element, "mousemove", this.handleMouseMove)
      .listen(this.element, "mouseleave", this.handleMouseLeave)
  }

  private handleMouseDown(e: MouseEvent) {
    if (this._dragging || e.button !== 0) return;
    this._dragging = true;

    e.preventDefault();

    this.handleGlobalMouseMove(e, true);
  }

  private handleGlobalMouseMove(e: MouseEvent, dragStart: boolean = false) {
    if (!this._dragging) return;
    e.preventDefault();
    
    var rect = this.element.getBoundingClientRect();
    var x = Math.max(Math.min(e.clientX - rect.left, rect.width), 0);

    var value = x/rect.width;

    this.setValue(value*this.maxValue + this.minValue);
    this.hoverElement.style.left = "0px";
    this.hoverElement.style.transform = "scaleX(0)";

    this.dispatchHover(value*this.maxValue + this.minValue, rect);

    if (dragStart) {
      this.dispatchEvent('dragStart', this.value);
    }
    this._dragThrottled();
  }

  private handleGlobalMouseUp(e: MouseEvent) {
    if (!this._dragging || e.button !== 0) return;
    this._dragging = false;

    if (this._outside)
      this.setHoverEnabled(false);

    e.preventDefault();

    this.handleGlobalMouseMove(e);

    this.dispatchEvent('dragEnd', this.value);
  }

  private handleMouseEnter(e: MouseEvent) {
    this._outside = false;
    this.setHoverEnabled(true);

    this.handleMouseMove(e);
  }

  private handleMouseMove(e: MouseEvent) {
    if (this._dragging) return;
    e.preventDefault();
    
    if (this.maxValue === this.minValue) {
      this.hoverElement.style.left = "0px";
      this.hoverElement.style.transform = "scaleX(0)";
    } else {
      var rect = this.element.getBoundingClientRect();
      var x = Math.max(Math.min(e.clientX - rect.left, rect.width), 0);

      var value = x/rect.width;

      var progress = this.getProgressPercentage();

      var rem = Math.max(value - progress, 0);

      this.hoverElement.style.left = (rect.width * progress) + "px";
      this.hoverElement.style.transform = "scaleX(" + rem + ")";

      this.dispatchHover(value*this.maxValue + this.minValue, rect);
    }
  }

  getPaddingElementOffset(): IRect {
    return getOffsetRect(this.paddingElement, this.playerElement);
  }

  private dispatchHover(time, rect) {
    var p = (time - this.minValue)/(this.maxValue - this.minValue);
    
    var { left, top, width } = this.getPaddingElementOffset();
    left += p*width;

    var detail: IHover = {
      x: left,
      y: top,
      time: time
    }

    this.dispatchEvent('hover', detail);
  }

  private setHoverEnabled(enabled: boolean) {
    if (enabled) {
      this.element.classList.add('html5-player-progress--hover');
    } else {
      this.element.classList.remove('html5-player-progress--hover');
      this.dispatchEvent('hover', null);
    }
  }

  private getProgressPercentage(): number {
    if (this.maxValue === this.minValue) return 0;

    return (this.value - this.minValue)/(this.maxValue - this.minValue);
  }

  private getBufferingPercentage(): number {
    if (this.maxValue === this.minValue) return 0;

    return (this.bufferingValue - this.minValue)/(this.maxValue - this.minValue);
  }

  private handleMouseLeave() {
    this._outside = true;

    if (this._dragging) return;

    this.setHoverEnabled(false);
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.handler.dispose();
    this.handler = null;
  }

  private createDom() {
    this.element = document.createElement("div");
    this.element.className = "html5-player-progress";

    this.element.setAttribute("tabindex", "0");
    this.element.setAttribute("role", "slider");
    this.element.setAttribute("aria-label", "Seek slider");
    this.element.setAttribute("draggable", "true");

    this.paddingElement = document.createElement("div");
    this.paddingElement.className = "html5-player-progress-padding";

    this.element.appendChild(this.paddingElement);

    var progressList = document.createElement("div");
    progressList.className = "html5-player-progress__list";

    this.progressElement = document.createElement("div");
    this.progressElement.className = "html5-player-progress__progress";
    this.progressElement.style.left = "0px";
    this.progressElement.style.transform = "scaleX(0)";

    progressList.appendChild(this.progressElement);

    this.bufferingElement = document.createElement("div");
    this.bufferingElement.className = "html5-player-progress__buffering";
    this.bufferingElement.style.left = "0px";
    this.bufferingElement.style.transform = "scaleX(0)";

    progressList.appendChild(this.bufferingElement);

    this.hoverElement = document.createElement("div");
    this.hoverElement.className = "html5-player-progress__hover";
    this.hoverElement.style.left = "0px";
    this.hoverElement.style.transform = "scaleX(0)";

    progressList.appendChild(this.hoverElement);

    this.element.appendChild(progressList);

    this.scrubberElement = document.createElement("div");
    this.scrubberElement.className = "html5-player-progress__scrubber-container";

    var scrubberButton = document.createElement("div");
    scrubberButton.className = "html5-player-progress__scrubber-btn";

    var scrubber = document.createElement("div");
    scrubber.className = "html5-player-progress__scrubber";

    scrubberButton.appendChild(scrubber);

    this.scrubberElement.appendChild(scrubberButton);

    this.element.appendChild(this.scrubberElement);
  }

  updateDom() {
    if (!this._updateDom) return;

    this.element.setAttribute("aria-valuenow", this.value.toString());
    this.element.setAttribute("aria-valuetext", parseAndFormatTime(this.value) + " of " + parseAndFormatTime(this.maxValue));

    this.element.setAttribute("aria-valuemin", this.minValue.toString());
    this.element.setAttribute("aria-valuemax", this.minValue.toString());

    var progress = this.getProgressPercentage();
    var buffering = this.getBufferingPercentage();
    
    this.progressElement.style.left = "0px";
    this.progressElement.style.transform = "scaleX(" + progress + ")";
    
    this.bufferingElement.style.left = "0px";
    this.bufferingElement.style.transform = "scaleX(" + buffering + ")";

    var rect = this.element.getBoundingClientRect();

    this.scrubberElement.style.transform = "translateX(" + (progress * rect.width) + "px)";
  }

  setUpdateDom(updateDom: boolean) {
    this._updateDom = updateDom;

    this.updateDom();
  }

  getElement(): Element {
    return this.element;
  }

  setValue(value: number): void {
    this.value = value;

    this.updateDom();
  }

  setBufferingValue(value: number): void {
    this.bufferingValue = value;

    this.updateDom();
  }

  setMinValue(minValue: number): void {
    this.minValue = minValue;

    this.updateDom();
  }

  setMaxValue(maxValue: number): void {
    this.maxValue = maxValue;

    this.updateDom();
  }
}
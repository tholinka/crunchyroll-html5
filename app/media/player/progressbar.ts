import { EventTarget } from '../../events/eventtarget';
import { EventHandler } from '../../events/eventhandler';

import { parseAndFormatTime } from '../../utils/time';

export class ProgressBarElement extends EventTarget {
  private element: Element;
  private minValue: number = 0;
  private maxValue: number = 0;
  private value: number = 0;

  private handler: EventHandler = new EventHandler(this);

  constructor() {
    super();

    this.createDom();

    this.handler
      .listen(this.element, "mouseover", this.handleMouseover)
  }

  private handleMouseover() {

  }

  protected disposeInternal() {
    super.disposeInternal();

    this.handler.dispose();
    this.handler = null;
  }

  private createDom() {
    this.element = document.createElement("div");
    this.element.className = "html5-player__progress-bar";

    this.element.setAttribute("tabindex", "0");
    this.element.setAttribute("role", "slider");
    this.element.setAttribute("aria-label", "Seek slider");
    this.element.setAttribute("draggable", "true");
  }

  setValue(value: number): void {
    this.value = value;

    this.element.setAttribute("aria-valuenow", this.value.toString());
    this.element.setAttribute("aria-valuetext", parseAndFormatTime(this.value) + "of " + parseAndFormatTime(this.maxValue));
  }

  setMinValue(minValue: number): void {
    this.minValue = minValue;

    this.element.setAttribute("aria-valuemin", this.minValue.toString());
  }

  setMaxValue(maxValue: number): void {
    this.maxValue = maxValue;

    this.element.setAttribute("aria-valuemax", this.minValue.toString());
  }
}
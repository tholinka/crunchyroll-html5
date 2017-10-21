import { parseAndFormatTime } from '../../utils/time';
import { Disposable } from '../../disposable';
import { EventHandler } from '../../events/eventhandler';

export const Flags: ({ [key: string]: number }) = {
  PREVIEW: 1 << 0,
  TEXT_DETAIL: 1 << 1,
  HAS_DURATION: 1 << 2,
};

export class Tooltip extends Disposable {
  private element: HTMLElement;
  private backgroundElement: HTMLElement;
  private durationElement: Element;

  private textWrapperElement: Element;
  private imageElement: Element;
  private titleElement: Element;
  private textElement: Element;

  private width: number;
  private height: number;

  private flags: number = 0;

  private visible: boolean = false;

  private handler = new EventHandler(this);

  constructor() {
    super();

    this.element = document.createElement("div");
    this.element.style.display = "none";
    this.element.className = "html5-player-tooltip";
    this.element.setAttribute("aria-hidden", "true");

    this.backgroundElement = document.createElement("div");
    this.backgroundElement.className = "html5-player-tooltip__bg";

    this.durationElement = document.createElement("div");
    this.durationElement.className = "html5-player-tooltip__duration";

    this.backgroundElement.appendChild(this.durationElement);

    this.textWrapperElement = document.createElement("div");
    this.textWrapperElement.className = "html5-player-tooltip__text-wrapper";

    this.imageElement = document.createElement("div");
    this.imageElement.className = "html5-player-tooltip__image";

    this.titleElement = document.createElement("div");
    this.titleElement.className = "html5-player-tooltip__title";

    this.textElement = document.createElement("span");
    this.textElement.className = "html5-player-tooltip__text";

    this.textWrapperElement.appendChild(this.imageElement);
    this.textWrapperElement.appendChild(this.titleElement);
    this.textWrapperElement.appendChild(this.textElement);

    this.element.appendChild(this.backgroundElement);
    this.element.appendChild(this.textWrapperElement);

    this.updateClasses();

    this.handler
      .listen(this.element, "transitionend", this.handleTransitionEnd);
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.handler.dispose();
    this.handler = null;
  }

  private updateClasses() {
    if (this.flags & Flags.PREVIEW) {
      this.element.classList.add("html5-player-tooltip--preview");
    } else {
      this.element.classList.remove("html5-player-tooltip--preview");
    }

    if (this.flags & Flags.TEXT_DETAIL) {
      this.element.classList.add("html5-player-tooltip--text-detail");
    } else {
      this.element.classList.remove("html5-player-tooltip--text-detail");
    }

    if (this.flags & Flags.HAS_DURATION) {
      this.element.classList.add("html5-player-tooltip--has-duration");
    } else {
      this.element.classList.remove("html5-player-tooltip--has-duration");
    }
  }

  private handleTransitionEnd() {
    if (!this.visible) {
      this.element.style.display = "none";
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  setFlags(flags: number) {
    this.flags = flags;

    this.updateClasses();
  }

  addFlag(flag: number) {
    this.flags |= flag;

    this.updateClasses();
  }

  removeFlag(flag: number) {
    this.flags &= flag;

    this.updateClasses();
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.backgroundElement.style.width = width + "px";
    this.backgroundElement.style.height = height + "px";
  }

  setPosition(x: number, y: number) {
    this.element.style.left = x + "px";
    this.element.style.top = y + "px";
  }

  setBackground(url: string);
  setBackground(url: string, width?: number, height?: number);
  setBackground(url: string, width?: number, height?: number, x?: number, y?: number);
  setBackground(url: string, width?: number, height?: number, x: number = 0, y: number = 0) {
    this.backgroundElement.style.backgroundImage = "URL(" + JSON.stringify(url) + ")";

    if (typeof width !== "number") width = this.width;
    if (typeof height !== "number") height = this.height;
    this.backgroundElement.style.backgroundSize = width + "px " + height + "px";
    this.backgroundElement.style.backgroundPosition = x + "px " + y + "px";
  }

  setDuration(duration: number) {
    this.durationElement.textContent = parseAndFormatTime(duration);
  }

  setTitle(title: string) {
    this.titleElement.textContent = title;
  }

  setText(text: Text) {
    this.textElement.innerHTML = "";
    this.textElement.appendChild(text);
  }

  setTextContent(text: string) {
    this.textElement.textContent = text;
  }

  setVisible(visible: boolean, force: boolean = false) {
    if (this.visible === visible) return;

    this.visible = visible;
    if (visible) {
      this.element.style.display = "";

      this.element.setAttribute("aria-hidden", "false");
    } else {
      this.element.setAttribute("aria-hidden", "true");
      if (force) {
        this.element.style.display = "none";
      }
    }
  }
}
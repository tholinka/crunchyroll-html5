import { EventTarget } from '../../events/eventtarget';
import { EventHandler } from '../../events/eventhandler';

export class BezelElement extends EventTarget {
  private element: HTMLElement;
  private iconElement: Element;

  private handler = new EventHandler(this);

  constructor() {
    super();

    this.element = document.createElement("div");
    this.element.className = "html5-player__bezel";
    this.element.style.display = "none";
    this.element.setAttribute("role", "status");

    this.iconElement = document.createElement("div");
    this.iconElement.className = "html5-player__bezel-icon";

    this.element.appendChild(this.iconElement);

    this.handler.listen(this.element, 'animationend', this.handleAnimationEnd);
  }

  private handleAnimationEnd() {
    this.element.style.display = "none";
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.handler.dispose();
    this.handler = null;
  }

  getElement(): Element {
    return this.element;
  }

  stop() {
    this.element.style.display = "none";
  }

  play(element: Element) {
    this.stop();

    window.setTimeout(() => {
      this.iconElement.innerHTML = "";
      this.iconElement.appendChild(element);

      this.element.style.display = "";
    }, 7);
  }

  playSvg(path: string) {
    var element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    element.setAttribute("width", "100%");
    element.setAttribute("height", "100%");
    element.setAttribute("version", "1.1");
    element.setAttribute("viewBox", "0 0 36 36");

    var pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttributeNS(null, "d", path);
    pathElement.setAttributeNS(null, "fill", "#ffffff");

    element.appendChild(pathElement);

    this.play(element);
  }
}
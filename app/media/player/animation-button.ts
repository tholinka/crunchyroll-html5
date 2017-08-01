import { EventTarget } from '../../events/eventtarget';
import { EventHandler } from '../../events/eventhandler';

import { SvgAnimation } from '../../utils/animation';

export class AnimationButton extends EventTarget {
  private element: Element;
  private pathElement: Element;
  private handler: EventHandler = new EventHandler(this);
  private animation: SvgAnimation;

  constructor(path: string = '') {
    super();

    this.element = document.createElement("button");
    this.element.className = "html5-player__button";

    var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "100%");
    svgElement.setAttribute("version", "1.1");
    svgElement.setAttribute("viewBox", "0 0 36 36");

    this.pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.pathElement.setAttributeNS(null, "d", path);
    this.pathElement.setAttributeNS(null, "fill", "#ffffff");

    svgElement.appendChild(this.pathElement);

    this.element.appendChild(svgElement);

    this.animation = new SvgAnimation(this.pathElement);

    this.handler
      .listen(this.element, 'click', this.handleClickEvent);
  }

  protected disposeInternal() {
    super.disposeInternal();

    this.handler.dispose();
    this.handler = null;

    this.animation.dispose();
    this.animation = null;
  }

  private handleClickEvent(): void {
    this.dispatchEvent('click', null);
  }

  getElement(): Element {
    return this.element;
  }

  setSvgContent(path: string) {
    this.pathElement.setAttributeNS(null, "d", path);
  }

  animate(path: string) {
    this.animation.stop();

    var currentPath = this.pathElement.getAttributeNS(null, "d");
    if (currentPath) {
      this.animation.setFromPath(currentPath);
      this.animation.setToPath(path);
      
      this.animation.start();
    } else {
      this.setSvgContent(path);
    }
  }
}
declare interface VendorFullscreenElement extends Element {
  mozRequestFullScreen(): void;
  msRequestFullscreen(): void;
}

declare interface VendorDocument extends Document {
  mozCancelFullScreen(): void;
  msExitFullscreen(): void;
  mozFullScreenElement: Element;
  msFullscreenElement: Element;
}

export function requestFullscreen(element: Element) {
  const el = element as VendorFullscreenElement;
  if (typeof el.requestFullscreen === "function") {
    el.requestFullscreen();
  } else if (typeof el.mozRequestFullScreen === "function") {
    el.mozRequestFullScreen();
  } else if (typeof el.webkitRequestFullScreen === "function") {
    el.webkitRequestFullScreen();
  } else if (typeof el.msRequestFullscreen === "function") {
    el.msRequestFullscreen();
  }
}

export function exitFullscreen() {
  const doc = document as VendorDocument;
  if (typeof doc.exitFullscreen === "function") {
    doc.exitFullscreen();
  } else if (typeof doc.webkitExitFullscreen === "function") {
    doc.webkitExitFullscreen();
  } else if (typeof doc.mozCancelFullScreen === "function") {
    doc.mozCancelFullScreen();
  } else if (typeof doc.msExitFullscreen === "function") {
    doc.msExitFullscreen();
  }
}

export function getFullscreenElement(): Element|undefined {
  const doc = document as VendorDocument;
  if (doc.fullscreenElement) {
    return doc.fullscreenElement;
  } else if (doc.webkitFullscreenElement) {
    return doc.webkitFullscreenElement;
  } else if (doc.mozFullScreenElement) {
    return doc.mozFullScreenElement;
  } else if (doc.msFullscreenElement) {
    return doc.msFullscreenElement;
  }
  return undefined;
}
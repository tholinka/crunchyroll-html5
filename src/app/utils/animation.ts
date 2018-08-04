declare interface VendorWindow extends Window {
  mozRequestAnimationFrame: (callback: Function) => number;
  oRequestAnimationFrame: (callback: Function) => number;
  msRequestAnimationFrame: (callback: Function) => number;

  mozCancelAnimationFrame: (id: number) => void;
  oCancelAnimationFrame: (id: number) => void;
  msCancelAnimationFrame: (id: number) => void;
}

export const requestAnimationFrame: (callback: Function) => number = (() => {
  const win = window as VendorWindow;
  if (typeof win.requestAnimationFrame === "function") {
    return win.requestAnimationFrame.bind(win);
  } else if (typeof win.webkitRequestAnimationFrame === "function") {
    return win.webkitRequestAnimationFrame.bind(win);
  } else if (typeof win.mozRequestAnimationFrame === "function") {
    return win.mozRequestAnimationFrame.bind(win);
  } else if (typeof win.oRequestAnimationFrame === "function") {
    return win.oRequestAnimationFrame.bind(win);
  } else if (typeof win.msRequestAnimationFrame === "function") {
    return win.msRequestAnimationFrame.bind(win);
  }

  const delay = 1000/60;
  return (callback: Function) => {
    return window.setTimeout(callback, delay);
  };
})();

export const cancelAnimationFrame: (id?: number) => void = (() => {
  const win = window as VendorWindow;
  if (typeof win.cancelAnimationFrame === "function") {
    return win.cancelAnimationFrame.bind(win);
  } else if (typeof win.webkitCancelAnimationFrame === "function") {
    return win.webkitCancelAnimationFrame.bind(win);
  } else if (typeof win.mozCancelAnimationFrame === "function") {
    return win.mozCancelAnimationFrame.bind(win);
  } else if (typeof win.oCancelAnimationFrame === "function") {
    return win.oCancelAnimationFrame.bind(win);
  } else if (typeof win.msCancelAnimationFrame === "function") {
    return win.msCancelAnimationFrame.bind(win);
  }

  return (id?: number) => {
    return window.clearTimeout(id);
  };
})();
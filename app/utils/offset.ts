export interface IRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function getOffsetRect(el: HTMLElement, relativeTo?: HTMLElement): IRect {
  var top = 0, left = 0;

  var width = el.offsetWidth;
  var height = el.offsetHeight;
    
  while (el && el.offsetParent && el !== relativeTo) {
    top += el.offsetTop;
    left += el.offsetLeft;
    el = <HTMLElement> el.offsetParent;
  }

  return {
    left: left,
    top: top,
    width: width,
    height: height
  };
}

export function getClientRect(el: HTMLElement, relativeTo?: HTMLElement): IRect {
  var { width, height, left, top } = el.getBoundingClientRect();
  if (relativeTo) {
    let rect2 = relativeTo.getBoundingClientRect();
    left -= rect2.left;
    top -= rect2.top;
  }

  return {
    left: left,
    top: top,
    width: width,
    height: height
  };
}
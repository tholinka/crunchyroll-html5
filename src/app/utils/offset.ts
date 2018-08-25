import { IRect } from "./rect";

export function getOffsetRect(el: HTMLElement, relativeTo?: HTMLElement): IRect {
  let top = 0;
  let left = 0;

  const width = el.offsetWidth;
  const height = el.offsetHeight;
    
  while (el && el.offsetParent && el !== relativeTo) {
    top += el.offsetTop;
    left += el.offsetLeft;
    el = el.offsetParent as HTMLElement;
  }

  return {
    left,
    top,
    width,
    height
  };
}

export function getClientRect(el: HTMLElement, relativeTo?: HTMLElement): IRect {
  let { width, height, left, top } = el.getBoundingClientRect();
  if (relativeTo) {
    const rect2 = relativeTo.getBoundingClientRect();
    left -= rect2.left;
    top -= rect2.top;
  }

  return {
    left,
    top,
    width,
    height
  };
}
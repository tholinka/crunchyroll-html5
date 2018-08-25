declare global {
  // tslint:disable-next-line:interface-name
  interface DOMTokenList {
    replace(oldClass: string, newClass: string): void;
    empty(): void;
  }
}

DOMTokenList.prototype.replace =
  DOMTokenList.prototype.replace ||
  // replace preserving order
  function replace(
    this: DOMTokenList,
    oldClass: string,
    newClass: string
  ): void {
    const list = Array.from(this).map(x => (x === oldClass ? newClass : x));
    this.empty();
    this.add(...list);
  };
DOMTokenList.prototype.empty = function empty(this: DOMTokenList) {
  for (const el in this) {
    if (this.hasOwnProperty(el)) {
      this.remove(el);
    }
  }
};

// needed so typescript recognises this as a module
export default undefined;

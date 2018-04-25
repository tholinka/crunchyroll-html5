declare global {
  interface DOMTokenList {
    replace(oldClass: string, newClass: string): void;
    empty(): void;
  }
}

DOMTokenList.prototype.replace = DOMTokenList.prototype.replace || 
  // replace preserving order
  function replace(this: DOMTokenList, oldClass: string, newClass: string): void {
    let list =  Array.from(this).map(x => x === oldClass ? newClass : x);
    this.empty();
    this.add(...list);
  };
DOMTokenList.prototype.empty = function empty(this: DOMTokenList) {
  for (let el in this) {
    this.remove(el);
  }
}

// needed so typescript recognises this as a module
export default undefined;
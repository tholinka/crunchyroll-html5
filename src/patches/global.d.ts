declare function cloneInto(
  data: object,
  targetScope: object,
  options?: { cloneFunctions?: boolean; wrapReflectors?: boolean }
): any;
declare interface Window {
  MyWorker: any;
  wrapCryptoSubtle: any;
  XMLHttpRequest: new () => XMLHttpRequest;
  Worker: any;
}

/**
 * This file contains the following fixes:
 * - [Chrome] Unable to create a WebWorker from chrome://<EXTENSION ID> due to
 *   CORS (very weird and strange).
 * - [Firefox] The event data from the `message` is apparently in the webworker
 *   context. Therefore `cloneInto` needs to be called with the event data to
 *   make it accessible.
 * - [Firefox] The crypto.subtle API has permission problem if `cloneInto` isn't
 *   used on the result.
 *
 * TODO: Split this file into smaller components as it's currently very
 *       unorderly.
 */

// tslint:disable
interface IQueue {
  method: 'addEventListener' | 'removeEventListener' | 'dispatchEvent';
  arguments: IArguments;
}

type EventFunction = (this: Worker, ev: MessageEvent) => any;
type ErrorFunction = (this: AbstractWorker, ev: ErrorEvent) => any;

const OriginalWorker = Worker;

function xrayMessage(originalListener: Function) {
  return function(this: Worker, e: { [key: string]: any }) {
    const evt: { [key: string]: any } = {};
    evt.data = cloneInto(e.data, evt, {
      cloneFunctions: true,
      wrapReflectors: true
    });
    evt.type = e.type;

    if (evt.data && typeof evt.data === 'object') {
      for (const key in evt.data) {
        if (evt.data.hasOwnProperty(key)) {
          if (key.substring(0, 3) === 'data') {
            evt.data[key] = new Uint8Array(evt.data[key]);
          }
        }
      }
    }

    originalListener.call(this, evt);
  };
}

class WorkerXHR {
  private _worker?: Worker;

  private _terminated = false;
  private _replayQueue: IQueue[] = [];
  private _messageQueue: IArguments[] = [];

  public get onmessage(): EventFunction | null {
    return this._onmessage;
  }
  public set onmessage(listener: EventFunction | null) {
    this._onmessage = listener;
    if (this._worker) {
      this._worker.onmessage = xrayMessage(listener);
    }
  }
  private _onmessage: EventFunction | null = null;

  public get onerror(): ErrorFunction | null {
    return this._onerror;
  }
  public set onerror(listener: ErrorFunction | null) {
    this._onerror = listener;
    if (this._worker) {
      this._worker.onerror = listener;
    }
  }
  private _onerror: ErrorFunction | null = null;

  constructor(url: string) {
    const x = new XMLHttpRequest();
    x.responseType = 'blob';
    x.onload = () => {
      // http://stackoverflow.com/a/10372280/938089
      const workerURL = URL.createObjectURL(
        new Blob([
          XMLHttpRequestPatchBlob(new URL(url, chrome.runtime.getURL(''))),
          x.response
        ])
      );
      this._bindWorker(workerURL);
    };
    x.open('GET', url);
    x.send();
  }

  public terminate(): void {
    if (!this._terminated) {
      this._terminated = true;
      if (this._worker) this._worker.terminate();
    }
  }

  public postMessage(message: any, transfer: any): void {
    if (this._worker) {
      this._worker.postMessage.apply(this._worker, arguments);
    } else {
      this._messageQueue.push(arguments);
    }
  }

  public addEventListener(...args: any[]): void {
    if (this._worker) {
      this._worker.addEventListener.apply(this._worker, arguments);
    } else {
      this._replayQueue.push({ method: 'addEventListener', arguments });
    }
  }

  public removeEventListener(...args: any[]): void {
    if (this._worker) {
      this._worker.removeEventListener.apply(this._worker, arguments);
    } else {
      this._replayQueue.push({ method: 'removeEventListener', arguments });
    }
  }

  public dispatchEvent(...args: any[]): void {
    if (this._worker) {
      this._worker.dispatchEvent.apply(this._worker, arguments);
    } else {
      this._replayQueue.push({ method: 'dispatchEvent', arguments });
    }
  }

  private _bindWorker(url: string) {
    if (this._terminated) {
      return;
    }

    const self = this;

    this._worker = new OriginalWorker(url);
    this._worker.onerror = this._onerror;
    this._worker.onmessage = this._onmessage
      ? xrayMessage(this._onmessage)
      : null;

    let replay: IQueue | undefined;

    while ((replay = this._replayQueue.shift()) !== undefined) {
      this._worker[replay.method].apply(this._worker, replay.arguments);
    }

    let message: IArguments | undefined;

    while ((message = this._messageQueue.shift()) !== undefined) {
      this._worker.postMessage.apply(this._worker, message);
    }
  }
}

function blobFunction(baseUrl: string): void {
  const open = self.XMLHttpRequest.prototype.open;

  self.XMLHttpRequest.prototype.open = function() {
    const args = Array.prototype.slice.call(arguments);
    if (args.length >= 2 && typeof args[1] === 'string') {
      const url = new URL(args[1], baseUrl);
      args[1] = url.toString();
    }

    open.apply(this, args);
  };
}

function XMLHttpRequestPatchBlob(baseUrl: URL): Blob {
  const fn =
    '(' +
    blobFunction.toString() +
    ')(' +
    JSON.stringify(baseUrl.toString()) +
    ');';

  return new Blob([fn], { type: 'text/plain' });
}

window.MyWorker = function MyWorker(url: string) {
  const worker = new OriginalWorker(url) as any;

  // Firefox patch for xray (cloneInto)
  if (typeof cloneInto === 'function') {
    const addEventListener = worker.addEventListener;
    const removeEventListener = worker.removeEventListener;

    const messageMap: [
      string,
      Function,
      boolean | { capture: boolean } | undefined,
      Function
    ][] = [];

    const messageMapIndex = (
      event: string,
      listener: Function,
      options?: boolean | { capture: boolean }
    ): number => {
      for (let i = 0; i < messageMap.length; i++) {
        const item = messageMap[i];
        if (
          item[0] === event &&
          item[1] === listener &&
          item[2] === getCapture(options)
        ) {
          return i;
        }
      }
      return -1;
    };
    const getCapture = (options: any): boolean => {
      let capture = !!options;
      if (
        options &&
        options.hasOwnProperty &&
        options.hasOwnProperty('capture')
      ) {
        capture = !!options.capture;
      }

      return capture;
    };

    worker.addEventListener = (
      event: string,
      listener: Function,
      options?: boolean | { capture: boolean }
    ) => {
      if (event === 'message') {
        const originalListener = listener;
        listener = xrayMessage(originalListener);
        messageMap.push([
          event,
          originalListener,
          getCapture(options),
          listener
        ]);
      }
      addEventListener.call(worker, event, listener, options);
    };

    worker.removeEventListener = (
      event: string,
      listener: Function,
      options?: boolean | { capture: boolean }
    ) => {
      if (event === 'message') {
        const index = messageMapIndex(event, listener, options);
        if (index !== -1) {
          listener = messageMap[index][3];
          messageMap.splice(index, 1);
        }
      }
      removeEventListener.call(worker, event, listener, options);
    };
  }

  return worker;
};

window.Worker = function(url: string) {
  let worker: Worker | WorkerXHR;
  try {
    worker = new OriginalWorker(url);
  } catch (e) {
    if (e.code === 18 /*DOMException.SECURITY_ERR*/) {
      worker = new WorkerXHR(url);
    } else {
      throw e;
    }
  }

  return worker;
};

try {
  if (typeof cloneInto === 'function') {
    window.wrapCryptoSubtle = (subtle: SubtleCrypto): any => {
      const cloneMethod = (method: string): any => {
        return function(this: SubtleCrypto) {
          return subtle[method].apply(subtle, arguments).then(data => {
            const obj: { [key: string]: any } = {};
            obj.data = cloneInto(data, obj);

            return obj.data;
          });
        };
      };

      return {
        deriveKey: cloneMethod('deriveKey'),
        digest: cloneMethod('digest'),
        encrypt: cloneMethod('encrypt'),
        exportKey: cloneMethod('exportKey'),
        generateKey: cloneMethod('generateKey'),
        importKey: cloneMethod('importKey'),
        sign: cloneMethod('sign'),
        unwrapKey: cloneMethod('unwrapKey'),
        verify: cloneMethod('verify'),
        wrapKey: cloneMethod('wrapKey'),
        decrypt: cloneMethod('decrypt')
      };
    };
  }
} catch (e) {}

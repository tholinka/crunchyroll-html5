import { uuidv4 } from "./utils/string";
import { IProxyInterface } from "./background/ProxyInterface";

export class ProxyLoaderWebExtension {
  private _port: browser.runtime.Port;
  private _callbacks?: Hls.LoaderCallbacks;
  private _context?: Hls.LoaderContext;

  constructor(config: Hls.LoaderConfig) {
    this._port = browser.runtime.connect({ name: "ProxyLoader" });
    this._port.onMessage.addListener((message: IProxyInterface) => {
      if (!this._callbacks || !this._context) return;
      switch (message.method) {
        case "onError": {
          if (this._callbacks.onError) {
            this._callbacks.onError(message.args[0], this._context);
          }
          break;
        }
        case "onProgress": {
          if (this._callbacks.onProgress) {
            this._callbacks.onProgress(message.args[0], this._context, message.args[2]);
          }
          break;
        }
        case "onSuccess": {
          if (this._callbacks.onSuccess) {
            this._callbacks.onSuccess(message.args[0], message.args[1], this._context);
          }
          break;
        }
        case "onTimeout": {
          if (this._callbacks.onTimeout) {
            this._callbacks.onTimeout(message.args[0], this._context);
          }
          break;
        }
      }
    });
  }

  private _callBackground(method: string, args?: any[]): void {
    const message = {
      method: method,
      args: args
    } as IProxyInterface;

    this._port.postMessage(message);
  }

  destroy(): void {
    this._port.disconnect();
  }

  abort(): void {
    this._callBackground("abort");
  }

  load(context: Hls.LoaderContext, config: Hls.LoaderConfig, callbacks: Hls.LoaderCallbacks) {
    this._context = context;
    this._callbacks = callbacks;

    let contextClone = Object.assign({}, this._context);
    delete (contextClone as any).loader;

    this._callBackground("load", [ contextClone, config ]);
  }
}
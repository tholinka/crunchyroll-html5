import { Event } from '../../events/Event';
import { CrossXMLHttpRequest } from './CrossXMLHttpRequest';

export interface ILoaderStats extends Hls.LoaderStats {
  aborted: boolean;
  retry: number;
  loaded: number;
}

interface IStats {
  trequest: number;
  retry: number;
  aborted?: boolean;
  tfirst?: number;
  tload?: number;
  loaded?: number;
  total?: number;
}

let useGreasemonkeyProxy = false;

export class ProxyLoaderGreasemonkey implements Hls.Loader {
  private _loader?: CrossXMLHttpRequest | XMLHttpRequest;

  private _requestTimeout?: number;
  private _retryTimeout?: number;

  private _context?: Hls.LoaderContext;
  private _config?: Hls.LoaderConfig;
  private _callbacks?: Hls.LoaderCallbacks;
  private _stats?: IStats;
  private _retryDelay?: number;

  constructor(config: Hls.LoaderConfig) {
    this._config = config;
  }

  public abort(): void {
    if (!this._stats) throw new Error('Stats is undefined');

    const loader = this._loader;
    if (loader && loader.readyState !== 4) {
      this._stats.aborted = true;
      loader.abort();
    }

    if (this._requestTimeout !== undefined) {
      window.clearTimeout(this._requestTimeout);
      this._requestTimeout = undefined;
    }

    if (this._retryTimeout !== undefined) {
      window.clearTimeout(this._retryTimeout);
      this._retryTimeout = undefined;
    }
  }

  public destroy(): void {
    this.abort();
    this._loader = undefined;
  }

  public load(
    context: Hls.LoaderContext,
    config: Hls.LoaderConfig,
    callbacks: Hls.LoaderCallbacks
  ) {
    this._context = context;
    this._config = config;
    this._callbacks = callbacks;
    this._stats = { trequest: performance.now(), retry: 0 };

    this._retryDelay = config.retryDelay;

    this._loadInternal();
  }

  private _loadInternal() {
    if (!this._stats) throw new Error('Stats is undefined');
    if (!this._context) throw new Error('Context is undefined');
    if (!this._callbacks) throw new Error('Callbacks is undefined');
    if (!this._config) throw new Error('Config is undefined');

    let xhr: CrossXMLHttpRequest | XMLHttpRequest;
    const context = this._context;
    if (useGreasemonkeyProxy) {
      xhr = this._loader = new CrossXMLHttpRequest();
    } else {
      xhr = this._loader = new XMLHttpRequest();
    }

    const stats = this._stats;
    stats.tfirst = 0;
    stats.loaded = 0;

    try {
      if (!xhr.readyState)
        (xhr as CrossXMLHttpRequest).open('GET', context.url, true);
    } catch (e) {
      // IE11 throws an exception on xhr.open if attempting to access an HTTP resource over HTTPS
      this._callbacks.onError({ code: xhr.status, text: e.message }, context);
      return;
    }

    if (context.rangeEnd)
      xhr.setRequestHeader(
        'Range',
        'bytes=' + context.rangeStart + '-' + (context.rangeEnd - 1)
      );

    xhr.onreadystatechange = this._readystatechange.bind(this, this._config);
    xhr.onprogress = this._loadprogress.bind(this);
    xhr.onerror = this._error.bind(this);
    xhr.responseType = context.responseType as XMLHttpRequestResponseType;

    // setup timeout before we perform request
    this._requestTimeout = window.setTimeout(
      this._loadtimeout.bind(this),
      this._config.timeout
    );
    (xhr as any).send();
  }

  private _readystatechange(config: Hls.LoaderConfig, event: Event) {
    if (!this._stats) throw new Error('Stats is undefined');
    if (!this._context) throw new Error('Context is undefined');
    if (!this._callbacks) throw new Error('Callbacks is undefined');
    if (this._retryDelay === undefined && config.maxRetry > 0)
      throw new Error('Retry delay is undefined when it can retry');

    const xhr = event.currentTarget as CrossXMLHttpRequest;
    const readyState = xhr.readyState;
    const stats = this._stats;
    const context = this._context;

    // don't proceed if xhr has been aborted
    if (stats.aborted) return;

    // >= HEADERS_RECEIVED
    if (readyState >= 2) {
      // clear xhr timeout and rearm it if readyState less than 4
      if (this._requestTimeout !== undefined) {
        window.clearTimeout(this._requestTimeout);
      }
      if (stats.tfirst === 0)
        stats.tfirst = Math.max(performance.now(), stats.trequest);

      if (readyState === 4) {
        const status = xhr.status;
        // http status between 200 to 299 are all successful
        if (status >= 200 && status < 300) {
          stats.tload = Math.max(stats.tfirst || 0, performance.now());
          let data;
          let len;
          if (context.responseType === 'arraybuffer') {
            data = xhr.response;
            len = data.byteLength;
          } else {
            data = xhr.responseText;
            len = data.length;
          }
          stats.loaded = stats.total = len;
          const response = { url: xhr.responseURL, data };
          this._callbacks.onSuccess(
            response,
            (stats as any) as Hls.LoaderStats,
            context
          );
        } else if (useGreasemonkeyProxy || status !== 0) {
          // if max nb of retries reached or if http status between 400 and 499 (such error cannot be recovered, retrying is useless), return error
          if (
            stats.retry >= config.maxRetry ||
            (status >= 400 && status < 499)
          ) {
            this._callbacks.onError(
              { code: status, text: xhr.statusText },
              context
            );
          } else {
            // retry
            // aborts and resets internal state
            this.destroy();
            // schedule retry
            this._retryTimeout = window.setTimeout(
              this._loadInternal.bind(this),
              this._retryDelay
            );
            // set exponential backoff
            this._retryDelay = Math.min(
              2 * (this._retryDelay || 0),
              config.maxRetryDelay
            );
            stats.retry++;
          }
        }
      } else {
        // readyState >= 2 AND readyState !==4 (readyState = HEADERS_RECEIVED || LOADING) rearm timeout as xhr not finished yet
        this._requestTimeout = window.setTimeout(
          this._loadtimeout.bind(this),
          config.timeout
        );
      }
    }
  }

  private _loadtimeout() {
    if (!this._context) throw new Error('Context is undefined');
    if (!this._callbacks) throw new Error('Callbacks is undefined');

    this._callbacks.onTimeout(
      (this._stats as any) as Hls.LoaderStats,
      this._context
    );
  }

  private _loadprogress(event: Event) {
    if (!this._stats) throw new Error('Stats is undefined');
    if (!this._callbacks) throw new Error('Callbacks is undefined');

    const stats = this._stats;

    stats.loaded = (event as any).loaded as number;
    if ((event as any).lengthComputable as boolean)
      stats.total = (event as any).total as number;

    const onProgress = this._callbacks.onProgress;
    if (onProgress) {
      // third arg is to provide on progress data
      onProgress(stats as any, this._context as any, null as any);
    }
  }

  private _error(config: Hls.LoaderConfig, event: Event): void {
    const xhr = event.currentTarget as CrossXMLHttpRequest;
    if (useGreasemonkeyProxy || xhr.status !== 0) return;
    useGreasemonkeyProxy = true;

    this._loader = undefined;

    if (this._requestTimeout !== undefined) {
      window.clearTimeout(this._requestTimeout);
      this._requestTimeout = undefined;
    }

    if (this._retryTimeout !== undefined) {
      window.clearTimeout(this._retryTimeout);
      this._retryTimeout = undefined;
    }

    this._stats = { trequest: performance.now(), retry: 0 };
    this._retryDelay = config.retryDelay;
    this._config = config;
    this._loadInternal();
  }
}

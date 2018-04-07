import { Event } from '../../events/Event';
import { CrossXMLHttpRequest } from "./CrossXMLHttpRequest";

export interface LoaderStats extends Hls.LoaderStats {
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

export class ProxyLoaderGreasemonkey {
  private loader?: CrossXMLHttpRequest|XMLHttpRequest;
  
  private requestTimeout?: number;
  private retryTimeout?: number;

  private context: Hls.LoaderContext;
  private config: Hls.LoaderConfig;
  private callbacks: Hls.LoaderCallbacks;
  private stats: IStats;
  private retryDelay: number;

  destroy(): void {
    this.abort();
    this.loader = undefined;
  }

  abort(): void {
    let loader = this.loader;
    if (loader && loader.readyState !== 4) {
      this.stats.aborted = true;
      loader.abort();
    }

    if (this.requestTimeout !== undefined) {
      window.clearTimeout(this.requestTimeout);
      this.requestTimeout = undefined;
    }

    if (this.retryTimeout !== undefined) {
      window.clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }
  }

  load(context: Hls.LoaderContext, config: Hls.LoaderConfig, callbacks: Hls.LoaderCallbacks) {
    this.context = context;
    this.config = config;
    this.callbacks = callbacks;
    this.stats = { trequest: performance.now(), retry: 0 };
    this.retryDelay = config.retryDelay;
    this.loadInternal();
  }

  loadInternal() {
    let xhr, context = this.context;
    if (useGreasemonkeyProxy) {
      xhr = this.loader = new CrossXMLHttpRequest();
    } else {
      xhr = this.loader = new XMLHttpRequest();
    }

    let stats = this.stats;
    stats.tfirst = 0;
    stats.loaded = 0;

    try {
      if (!xhr.readyState)
        xhr.open('GET', context.url, true);
    } catch (e) {
      // IE11 throws an exception on xhr.open if attempting to access an HTTP resource over HTTPS
      this.callbacks.onError({ code: xhr.status, text: e.message }, context);
      return;
    }

    if (context.rangeEnd)
      xhr.setRequestHeader('Range', 'bytes=' + context.rangeStart + '-' + (context.rangeEnd - 1));

    xhr.onreadystatechange = this.readystatechange.bind(this);
    xhr.onprogress = this.loadprogress.bind(this);
    xhr.onerror = this._error.bind(this);
    xhr.responseType = context.responseType as XMLHttpRequestResponseType;

    // setup timeout before we perform request
    this.requestTimeout = window.setTimeout(this.loadtimeout.bind(this), this.config.timeout);
    (xhr as any).send();
  }

  private _error(event: Event): void {
    const xhr = event.currentTarget as CrossXMLHttpRequest;
    if (useGreasemonkeyProxy || xhr.status !== 0) return;
    useGreasemonkeyProxy = true;

    this.loader = undefined;

    if (this.requestTimeout !== undefined) {
      window.clearTimeout(this.requestTimeout);
      this.requestTimeout = undefined;
    }

    if (this.retryTimeout !== undefined) {
      window.clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }

    this.stats = { trequest: performance.now(), retry: 0 };
    this.retryDelay = this.config.retryDelay;
    this.loadInternal();
  }

  readystatechange(event: Event) {
    let xhr = event.currentTarget as CrossXMLHttpRequest,
      readyState = xhr.readyState,
      stats = this.stats,
      context = this.context,
      config = this.config;

    // don't proceed if xhr has been aborted
    if (stats.aborted)
      return;

    // >= HEADERS_RECEIVED
    if (readyState >= 2) {
      // clear xhr timeout and rearm it if readyState less than 4
      if (this.requestTimeout !== undefined) {
        window.clearTimeout(this.requestTimeout);
      }
      if (stats.tfirst === 0)
        stats.tfirst = Math.max(performance.now(), stats.trequest);

      if (readyState === 4) {
        let status = xhr.status;
        // http status between 200 to 299 are all successful
        if (status >= 200 && status < 300) {
          stats.tload = Math.max(stats.tfirst || 0, performance.now());
          let data, len;
          if (context.responseType === 'arraybuffer') {
            data = xhr.response;
            len = data.byteLength;
          } else {
            data = xhr.responseText;
            len = data.length;
          }
          stats.loaded = stats.total = len;
          let response = { url: xhr.responseURL, data: data };
          this.callbacks.onSuccess(response, stats as any as Hls.LoaderStats, context);
        } else if (useGreasemonkeyProxy || status !== 0) {
          // if max nb of retries reached or if http status between 400 and 499 (such error cannot be recovered, retrying is useless), return error
          if (stats.retry >= config.maxRetry || (status >= 400 && status < 499)) {
            this.callbacks.onError({ code: status, text: xhr.statusText }, context);
          } else {
            // retry
            // aborts and resets internal state
            this.destroy();
            // schedule retry
            this.retryTimeout = window.setTimeout(this.loadInternal.bind(this), this.retryDelay);
            // set exponential backoff
            this.retryDelay = Math.min(2 * this.retryDelay, config.maxRetryDelay);
            stats.retry++;
          }
        }
      } else {
        // readyState >= 2 AND readyState !==4 (readyState = HEADERS_RECEIVED || LOADING) rearm timeout as xhr not finished yet
        this.requestTimeout = window.setTimeout(this.loadtimeout.bind(this), config.timeout);
      }
    }
  }

  loadtimeout () {
    this.callbacks.onTimeout(this.stats as any as Hls.LoaderStats, this.context);
  }

  loadprogress(event: Event) {
    let stats = this.stats;

    stats.loaded = (event as any).loaded as number;
    if ((event as any).lengthComputable as boolean)
      stats.total = (event as any).total as number;

    let onProgress = this.callbacks.onProgress;
    if (onProgress) {
      // third arg is to provide on progress data
      (onProgress as Function)(stats, this.context, null);
    }
  }
}
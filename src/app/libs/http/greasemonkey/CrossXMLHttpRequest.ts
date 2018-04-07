import { Event } from '../../events/Event';

enum State {
  Closed,
  Opened,
  Working,
  Completed,
}

export class CrossXMLHttpRequest {
  private _state: State = State.Closed;

  private _readyState: number = 0;
  private _status: number = 0;
  private _statusText: string = "";

  private _response: any;
  private _responseText: string = "";
  private _responseType: XMLHttpRequestResponseType = "";
  private _responseUrl: string = "";

  private _opened: boolean = false;
  private _headers: {[key: string]: string} = {};

  private _method: string = "GET";
  private _url: string = "";
  private _async: boolean = true;
  private _user?: string;
  private _password?: string;

  public onabort?: Function;
  public onerror?: Function;
  public onload?: Function;
  public onprogress?: Function;
  public onreadystatechange?: Function;
  public ontimeout?: Function;

  private loader?: GMXMLHttpRequestResult;

  get readyState(): number {
    return this._readyState;
  }

  get response(): any {
    return this._response || this._responseText;
  }

  get responseText(): string {
    return this._responseText;
  }

  get responseURL(): string {
    return this._responseUrl;
  }

  get status(): number {
    return this._status;
  }

  get statusText(): string {
    return this._statusText;
  }

  get responseType(): XMLHttpRequestResponseType {
    return this._responseType;
  }

  set responseType(type: XMLHttpRequestResponseType) {
    this._responseType = type;
  }

  setRequestHeader(header: string, value: string): void {
    if (this._state !== State.Opened) throw new Error("XMLHttpRequest has not been opened.");
    this._headers[header] = value;
  }

  abort(): void {
    if (!this.loader || !this.loader.abort) {
      console.warn("abort() is not supported for this GM_xmlhttpRequest implementation!");
      return;
    }
    this.loader.abort();
  }

  open(method: string, url: string, async: boolean = true, user?: string | null, password?: string | null): void {
    if (this._state !== State.Closed) throw new Error("XMLHttpRequest has already been opened.");
    this._state = State.Opened;

    this._method = method;
    this._url = url;
    this._async = async;
    this._user = user === null ? undefined : user;
    this._password = password === null ? undefined : password;
  }

  send(body?: BodyInit): void {
    if (this._state !== State.Opened) throw new Error("XMLHttpRequest has not been opened.");

    if (body) console.warn("Body is not supported");

    this.loader = request({
      method: this._method,
      url: this._url,
      headers: this._headers,
      user: this._user,
      password: this._password,
      synchronous: !this._async,
      responseType: this._responseType,
      onabort: this._onAbort.bind(this),
      onerror: this._onError.bind(this),
      onload: this._onLoad.bind(this),
      onprogress: this._onProgress.bind(this),
      onreadystatechange: this._onReadyStateChange.bind(this),
      ontimeout: this._onTimeout.bind(this)
    } as any);
  }

  private _handleResponse(response: GMXMLHttpRequestResponse): void {
    this._readyState = response.readyState;
    this._status = response.status;
    this._statusText = response.statusText;
    this._response = (response as any).response;
    this._responseText = response.responseText;
    this._responseUrl = response.finalUrl;
  }

  private _onAbort(response: GMXMLHttpRequestResponse): void {
    this._handleResponse(response);

    if (this.onabort) {
      this.onabort(new Event("abort", this));
    }
  }

  private _onError(response: GMXMLHttpRequestResponse): void {
    this._handleResponse(response);

    if (this.onerror) {
      this.onerror(new Event("error", this));
    }
  }

  private _onLoad(response: GMXMLHttpRequestResponse): void {
    this._handleResponse(response);

    if (this.onload) {
      this.onload(new Event("load", this));
    }
  }

  private _onProgress(response: GMXMLHttpRequestResponse): void {
    this._handleResponse(response);

    if (this.onprogress) {
      this.onprogress(new Event("progress", this));
    }
  }

  private _onReadyStateChange(response: GMXMLHttpRequestResponse): void {
    this._handleResponse(response);

    if (this.onreadystatechange) {
      this.onreadystatechange(new Event("readystatechange", this));
    }
  }

  private _onTimeout(response: GMXMLHttpRequestResponse): void {
    this._handleResponse(response);

    if (this.ontimeout) {
      this.ontimeout(new Event("timeout", this));
    }
  }
}

function request(options: GMXMLHttpRequestOptions): GMXMLHttpRequestResult {
  if (typeof GM_xmlhttpRequest === "undefined") {
    return GM.xmlHttpRequest(options);
  } else {
    return GM_xmlhttpRequest(options);
  }
}

declare namespace GM {
  function xmlHttpRequest(options: GMXMLHttpRequestOptions): GMXMLHttpRequestResult;
}
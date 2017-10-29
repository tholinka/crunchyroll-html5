import { IBrowserMessage } from "../IBrowserMessage";

export type BodyType = string|{[key: string]: string|number};

const supported = (() => {
  return {
    GM_xmlhttpRequest: (() => {
      try {
        if (typeof (window as any)['GM_xmlhttpRequest'] === "function") {
          return true;
        }
      } catch (e) {}
      return false;
    })()
  };
})();

export interface IOptions {
  headers?: {[key: string]: string};

  /** Whether to do the request in the background. */
  background?: boolean;
}

function processBody(body: string|{[key: string]: string|number}|undefined) {
  if (!body) return undefined;

  if (typeof body === "object") {
    let tokens: string[] = [];
    for (let key in body) {
      if (body.hasOwnProperty(key)) {
        tokens.push(encodeURIComponent(key) + "=" + encodeURIComponent(body[key] + ''));
      }
    }

    return tokens.join("&");
  } else {
    return body;
  }
}

async function _methodBackground(
  method: string,
  url: string,
  body?: BodyType,
  options?: IOptions
): Promise<string> {
  if (supported.GM_xmlhttpRequest) {
    return new Promise<string>((resolve, reject) => {
      const details: GMXMLHttpRequestOptions = {
        url: url,
        method: method,
        data: processBody(body),
        onload: res => resolve(res.responseText),
        onerror: res => reject(res.status + ": " + res.statusText)
      };
      if (options) {
        if (options.headers) {
          details.headers = options.headers;
        }
      }

      GM_xmlhttpRequest(details);
    });
  } else if (browser && browser.runtime && typeof browser.runtime.sendMessage === "function") {
    const message: IBrowserMessage = {
      name: 'xhr',
      args: [method, url, body, options]
    };
    return browser.runtime.sendMessage(message) as Promise<string>;
  } else {
    return _method(method, url, body, options);
  }
}

export async function _method(method: string, url: string, body?: BodyType, options?: IOptions): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const req = new XMLHttpRequest();

    req.addEventListener("load", () => {
      resolve(req.responseText);
    });
    req.addEventListener("error", () => {
      resolve(req.status + ": " + req.statusText);
    });
    req.open(method, url, true);
    if (options) {
      if (options.headers) {
        for (let key in options.headers) {
          if (options.headers.hasOwnProperty(key)) {
            req.setRequestHeader(key, options.headers[key])
          }
        }
      }
    }
    req.send(processBody(body));
  });
}

export async function method(method: string, url: string, body?: BodyType, options?: IOptions): Promise<string> {
  if (options && options.background) {
    return _methodBackground(method, url, body, options);
  } else {
    return _method(method, url, body, options);
  }
}

export async function get(url: string, options?: IOptions): Promise<string> {
  return method('GET', url, undefined, options);
}

export async function post(url: string, body?: BodyType, options?: IOptions): Promise<string> {
  return method('POST', url, body, options);
}
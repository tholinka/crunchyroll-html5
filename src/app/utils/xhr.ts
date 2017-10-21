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
  headers?: {[key: string]: string}
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

export async function method(method: string, url: string, body?: string|{[key: string]: string|number}, options?: IOptions): Promise<string> {
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
  } else {
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
}

export async function get(url: string, options?: IOptions): Promise<string> {
  return method('GET', url, undefined, options);
}

export async function post(url: string, body?: string|{[key: string]: string|number}, options?: IOptions): Promise<string> {
  return method('POST', url, body, options);
}
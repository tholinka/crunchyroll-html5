import { IHttpClient, BodyType } from 'crunchyroll-lib/models/http/IHttpClient';
import { IOptions } from 'crunchyroll-lib/models/http/IOptions';
import { IResponse } from 'crunchyroll-lib/models/http/IResponse';
import { IBrowserMessage } from '../IBrowserMessage';

export class GreasemonkeyHttpClient implements IHttpClient {
  async method(method: 'GET'|'HEAD'|'POST'|'PUT'|'DELETE'|'CONNECT'|'OPTIONS'|'PATCH', url: string, body?: BodyType, options?: IOptions): Promise<IResponse<string>> {
    return new Promise<IResponse<string>>((resolve, reject) => {
      let data: string|undefined = undefined;
      if (typeof body === "string") {
        data = body;
      } else if (body !== undefined) {
        data = JSON.stringify(body);
      }
      const details = {
        url: url,
        method: method,
        data: data,
        onload: res => {
          resolve({
            body: res.responseText,
            status: res.status,
            statusText: res.statusText
          });
        },
        onerror: res => {
          reject({
            body: res.responseText,
            status: res.status,
            statusText: res.statusText
          });
        }
      } as GMXMLHttpRequestOptions;
      if (options) {
        if (options.headers) {
          details.headers = options.headers;
        }
      }

      request(details);
    });
  }

  get(url: string, options?: IOptions): Promise<IResponse<string>> {
    return this.method("GET", url, undefined, options);
  }

  post(url: string, body?: BodyType, options?: IOptions): Promise<IResponse<string>> {
    return this.method("POST", url, body, options);
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
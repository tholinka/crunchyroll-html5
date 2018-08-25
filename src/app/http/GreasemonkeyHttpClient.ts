import { BodyType, IHttpClient } from 'crunchyroll-lib/models/http/IHttpClient';
import { IOptions } from 'crunchyroll-lib/models/http/IOptions';
import { IResponse } from 'crunchyroll-lib/models/http/IResponse';

export class GreasemonkeyHttpClient implements IHttpClient {
  public async method(
    method:
      | 'GET'
      | 'HEAD'
      | 'POST'
      | 'PUT'
      | 'DELETE'
      | 'CONNECT'
      | 'OPTIONS'
      | 'PATCH',
    url: string,
    body?: BodyType,
    options?: IOptions
  ): Promise<IResponse<string>> {
    return new Promise<IResponse<string>>((resolve, reject) => {
      let data: string | undefined;
      if (typeof body === 'string') {
        data = body;
      } else if (body !== undefined) {
        data = JSON.stringify(body);
      }
      const details = {
        url,
        method,
        data,
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

  public get(url: string, options?: IOptions): Promise<IResponse<string>> {
    return this.method('GET', url, undefined, options);
  }

  public post(
    url: string,
    body?: BodyType,
    options?: IOptions
  ): Promise<IResponse<string>> {
    return this.method('POST', url, body, options);
  }
}

function request(options: GMXMLHttpRequestOptions): GMXMLHttpRequestResult {
  if (typeof GM_xmlhttpRequest === 'undefined') {
    return GM.xmlHttpRequest(options);
  } else {
    return GM_xmlhttpRequest(options);
  }
}

// tslint:disable-next-line:no-namespace
declare namespace GM {
  function xmlHttpRequest(
    options: GMXMLHttpRequestOptions
  ): GMXMLHttpRequestResult;
}

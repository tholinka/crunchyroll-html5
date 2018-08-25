import { BodyType, IHttpClient } from 'crunchyroll-lib/models/http/IHttpClient';
import { IOptions } from 'crunchyroll-lib/models/http/IOptions';
import { IResponse } from 'crunchyroll-lib/models/http/IResponse';
import { IBrowserMessage } from '../models/IBrowserMessage';

export class BackgroundHttpClient implements IHttpClient {
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
    const message = {
      name: 'xhr',
      args: [method, url, body, options]
    } as IBrowserMessage;
    return browser.runtime.sendMessage(message) as Promise<IResponse<string>>;
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

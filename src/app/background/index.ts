import container from 'crunchyroll-lib/config';
import { IHttpClient } from 'crunchyroll-lib/models/http/IHttpClient';
import { IBrowserMessage } from '../models/IBrowserMessage';

browser.runtime.onMessage.addListener(
  (message: IBrowserMessage, sender, sendResponse) => {
    switch (message.name) {
      case 'xhr': {
        const httpClient = container.get<IHttpClient>('IHttpClient');

        return httpClient.method.apply(httpClient, message.args);
      }
    }
    return undefined;
  }
);

import { IXMLHttpRequestFactory } from 'crunchyroll-lib/models/http/IXMLHttpRequestFactory'

declare function XPCNativeWrapper<T>(obj: T): T;

// tslint:disable-next-line:no-namespace
declare namespace window {
  const wrappedJSObject: {
    XMLHttpRequest: { new(): XMLHttpRequest }
  };
}

export class XMLHttpRequestFactory implements IXMLHttpRequestFactory {
  public create(): XMLHttpRequest {
    try {
      return XPCNativeWrapper<XMLHttpRequest>(new window.wrappedJSObject.XMLHttpRequest());
    } catch (e) {
      return new XMLHttpRequest();
    }
  }
}
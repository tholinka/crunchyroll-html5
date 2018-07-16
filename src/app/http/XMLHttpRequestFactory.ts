import { IXMLHttpRequestFactory } from 'crunchyroll-lib/models/http/IXMLHttpRequestFactory'

declare function XPCNativeWrapper<T>(obj: T): T;

declare module window {
  const wrappedJSObject: {
    XMLHttpRequest: { new(): XMLHttpRequest }
  };
}

export class XMLHttpRequestFactory implements IXMLHttpRequestFactory {
  create(): XMLHttpRequest {
    try {
      return XPCNativeWrapper<XMLHttpRequest>(new window.wrappedJSObject.XMLHttpRequest());
    } catch (e) {
      return new XMLHttpRequest();
    }
  }
}
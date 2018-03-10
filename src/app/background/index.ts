import { IBrowserMessage } from "../IBrowserMessage";
import * as request from "../utils/xhr";
import { ProxyLoader } from "./ProxyLoader";
import { IProxyInterface } from "./ProxyInterface";

browser.runtime.onMessage.addListener((message: IBrowserMessage, sender, sendResponse) => {
  switch (message.name) {
    case "xhr": {
      const method: string = message.args[0];
      const url: string = message.args[1];
      const body: request.BodyType|undefined = message.args[2];

      const options = message.args[3] as request.IOptions;
      options.background = false;

      return request.method(message.args[0], message.args[1], message.args[2], options);
    }
  }
  return undefined;
});

browser.runtime.onConnect.addListener(port => {
  if (port.name !== "ProxyLoader") return;

  let loader: ProxyLoader|undefined = new ProxyLoader();

  const passCallback = (name: string, ...args: any[]) => {
    const message = {
      method: name,
      args: args
    } as IProxyInterface;

    port.postMessage(message);
  };

  port.onMessage.addListener((message: IProxyInterface) => {
    if (!loader) return;

    switch (message.method) {
      case "load": {
        loader.load(message.args[0], message.args[1], {
          onError: passCallback.bind(undefined, "onError"),
          onProgress: passCallback.bind(undefined, "onProgress"),
          onSuccess: passCallback.bind(undefined, "onSuccess"),
          onTimeout: passCallback.bind(undefined, "onTimeout")
        });
        break;
      }
      case "abort": {
        loader.abort.apply(loader, message.args);
        break;
      }
      case "destroy": {
        loader.destroy.apply(loader, message.args);
        break;
      }
    }
  });

  port.onDisconnect.addListener(() => {
    if (!loader) return;
    loader.destroy();
    loader = undefined;
  });
});
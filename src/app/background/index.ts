import { IBrowserMessage } from "../IBrowserMessage";
import * as request from "../utils/xhr";

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
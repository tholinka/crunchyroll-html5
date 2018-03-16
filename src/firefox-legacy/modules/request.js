const { callUnsafeJSObject, isWindowClosed, isWindowPrivate } = require("utils");

function request(wrappedContentWin, sandbox, details) {
  let req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  let addEventReq = addEventListener.bind(this, wrappedContentWin, sandbox, req);
  
  details = Cu.waiveXrays(details);
  
  addEventReq("abort", details);
  addEventReq("error", details);
  addEventReq("load", details);
  addEventReq("progress", details);
  addEventReq("readystatechange", details);
  addEventReq("timeout", details);
  if (details.upload) {
    let addEventReqUpload = addEventListener.bind(this, wrappedContentWin, sandbox, req.upload);
    addEventReqUpload("abort", details);
    addEventReqUpload("error", details);
    addEventReqUpload("load", details);
    addEventReqUpload("progress", details);
  }
  
  req.mozBackgroundRequest = !!details.mozBackgroundRequest;
  
  req.open(details.method, details.url, !details.synchronous, "", "");

  let channel;
  if (isWindowPrivate(wrappedContentWin)) {
    channel = req.channel
      .QueryInterface(Ci.nsIPrivateBrowsingChannel);
    channel.setPrivate(true);
  }
  
  if (details.overrideMimeType) {
    req.overrideMimeType(details.overrideMimeType);
  }

  if (details.responseType) {
    req.responseType = details.responseType;
  }
  
  if (details.timeout) {
    req.timeout = details.timeout;
  }
  
  if (details.headers) {
    const headers = details.headers;
    for (let prop in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, prop)) {
        req.setRequestHeader(prop, headers[prop]);
      }
    }
  }

  var body = details.data ? details.data : null;
  if (details.binary && (body !== null)) {
    const bodyLength = body.length;
    const bodyData = new Uint8Array(bodyLength);
    for (var i = 0; i < bodyLength; i++) {
      bodyData[i] = body.charCodeAt(i) & 0xff;
    }
    req.send(new Blob([bodyData]));
  } else {
    req.send(body);
  }
  
  var rv = {
    abort: function(){
      return req.abort();
    },
    finalUrl: null,
    readyState: null,
    responseHeaders: null,
    responseText: null,
    status: null,
    statusText: null
  };
  if (!!details.synchronous) {
    rv.finalUrl = req.finalUrl;
    rv.readyState = req.readyState;
    rv.responseHeaders = req.getAllResponseHeaders();
    rv.responseText = req.responseText;
    rv.status = req.status;
    rv.statusText = req.statusText;
  }

  rv = Cu.cloneInto({
    abort: rv.abort.bind(rv),
    finalUrl: rv.finalUrl,
    readyState: rv.readyState,
    responseHeaders: rv.responseHeaders,
    responseText: rv.responseText,
    status: rv.status,
    statusText: rv.statusText
  }, sandbox, { cloneFunctions: true });

  return rv;
}

function addEventListener(wrappedContentWin, sandbox, req, event, details) {
  function eventListener(evt) {
    // If details isn't available then cancel this.
    if (typeof details === "undefined") return;
    
    var responseState = {
      context: details.context || null,
      finalUrl: null,
      lengthComputable: null,
      loaded: null,
      readyState: req.readyState,
      response: req.response,
      responseHeaders: null,
      responseText: null,
      status: null,
      statusText: null,
      total: null
    };

    try {
      responseState.responseText = req.responseText;
    } catch (e) {}

    switch (event) {
      case "progress":
        responseState.lengthComputable = evt.lengthComputable;
        responseState.loaded = evt.loaded;
        responseState.total = evt.total;
        break;
      case "error":
        break;
      default:
        if (req.readyState !== 4) break;
        responseState.responseHeaders = req.getAllResponseHeaders();
        responseState.status = req.status;
        responseState.statusText = req.statusText;
        responseState.finalUrl = req.channel.URI.spec;
        break;
    }

    responseState = Components.utils.cloneInto({
      context: responseState.context,
      finalUrl: responseState.finalUrl,
      lengthComputable: responseState.lengthComputable,
      loaded: responseState.loaded,
      readyState: responseState.readyState,
      response: responseState.response,
      responseHeaders: responseState.responseHeaders,
      responseText: responseState.responseText,
      responseXML: responseState.responseXML,
      status: responseState.status,
      statusText: responseState.statusText,
      total: responseState.total
    }, sandbox, { cloneFunctions: true, wrapReflectors: true });
    
    /* The window is closed and therefore it should not be called! */
    if (isWindowClosed(wrappedContentWin)) return;
    
    var eventCallback = details["on" + event];
    
    new XPCNativeWrapper(wrappedContentWin, "setTimeout()")
        .setTimeout(function(){ eventCallback.call(details, responseState) }, 0);
  }
  
  if (typeof details === "undefined") return;
  if (typeof details["on" + event] !== "number" && typeof details["on" + event] !== "function") return;
  
  req.addEventListener(event, eventListener, false);
}

exports["request"] = request;
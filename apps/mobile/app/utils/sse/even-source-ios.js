/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

"use strict";
import _reactNative from "react-native";
import _eventTargetShim from "event-target-shim";

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

const EVENT_SOURCE_EVENTS = ["error", "message", "open", "connection-error"]; // char codes

const bom = [239, 187, 191]; // byte order mark

const lf = 10;
const cr = 13;
/**
 * An RCTNetworking-based implementation of the EventSource web standard.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/EventSource
 *     https://html.spec.whatwg.org/multipage/server-sent-events.html
 *     https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
 */

class EventSource extends (0, _eventTargetShim.default)(
  ...EVENT_SOURCE_EVENTS
) {
  // Properties
  // Default, retry over a minute per 2.5s.
  // Buffers for event stream parsing

  /**
   * Custom extension for tracking origins of request.
   */
  setTrackingName(trackingName) {
    this._trackingName = trackingName;
    return this;
  }
  /**
   * Creates a new EventSource
   * @param {string} url the URL at which to open a stream
   * @param {?Object} eventSourceInitDict extra configuration parameters
   */

  constructor(url, eventSourceInitDict) {
    super();

    _defineProperty(this, "readyState", EventSource.CONNECTING);

    _defineProperty(this, "withCredentials", false);

    _defineProperty(this, "maxRetryEvents", 24);

    _defineProperty(this, "reconnectIntervalMs", 2500);

    _defineProperty(this, "_isFirstChunk", false);

    _defineProperty(this, "_discardNextLineFeed", false);

    _defineProperty(this, "_lineBuf", "");

    _defineProperty(this, "_dataBuf", "");

    _defineProperty(this, "_eventTypeBuf", "");

    _defineProperty(this, "_lastEventIdBuf", "");

    _defineProperty(this, "_headers", {});

    _defineProperty(this, "_lastEventId", "");

    _defineProperty(this, "_trackingName", "unknown");

    _defineProperty(this, "_retryAttempts", 0);

    if (!url) {
      throw new Error("Cannot open an SSE stream on an empty url");
    }

    this.url = url;
    this._headers["Cache-Control"] = "no-cache";
    this._headers.Accept = "text/event-stream";

    if (this._lastEventId) {
      this._headers["Last-Event-ID"] = this._lastEventId;
    } // This is an upsetting hack that appears to only show on Android even though it is HIGHLY not recommended.

    if (_reactNative.Platform.OS === "android") {
      this._headers["X-Requested-With"] = "XMLHttpRequest";
    }

    if (eventSourceInitDict) {
      if (eventSourceInitDict.headers) {
        if (eventSourceInitDict.headers["Last-Event-ID"]) {
          this._lastEventId = eventSourceInitDict.headers["Last-Event-ID"];
          delete eventSourceInitDict.headers["Last-Event-ID"];
        }

        for (var headerKey in eventSourceInitDict.headers) {
          const header = eventSourceInitDict.headers[headerKey];

          if (header) {
            this._headers[headerKey] = header;
          }
        }
      }

      if (eventSourceInitDict.disableAndroidXRequestedWith) {
        if (_reactNative.Platform.OS === "android") {
          delete this._headers["X-Requested-With"];
        }
      }

      if (eventSourceInitDict.withCredentials) {
        this.withCredentials = eventSourceInitDict.withCredentials;
      }

      if (eventSourceInitDict.reconnectOptions) {
        if (eventSourceInitDict.reconnectOptions.reconnectIntervalMs) {
          this.reconnectIntervalMs =
            eventSourceInitDict.reconnectOptions.reconnectIntervalMs;
        }

        if (eventSourceInitDict.reconnectOptions.maxRetryEvents) {
          this.maxRetryEvents =
            eventSourceInitDict.reconnectOptions.maxRetryEvents;
        }
      }
    }

    this._subscriptions = [];

    this._subscriptions.push(
      _reactNative.Networking.addListener("didReceiveNetworkResponse", (args) =>
        this.__didReceiveResponse(...args)
      )
    );

    this._subscriptions.push(
      _reactNative.Networking.addListener(
        "didReceiveNetworkIncrementalData",
        (args) => this.__didReceiveIncrementalData(...args)
      )
    );

    this._subscriptions.push(
      _reactNative.Networking.addListener(
        "didCompleteNetworkResponse",
        (args) => this.__didCompleteResponse(...args)
      )
    );

    this.__connnect();
  }

  close() {
    if (this._requestId !== null && this._requestId !== undefined) {
      _reactNative.Networking.abortRequest(this._requestId);
    } // clean up Networking subscriptions

    (this._subscriptions || []).forEach((sub) => {
      if (sub) {
        sub.remove();
      }
    });
    this._subscriptions = [];
    this.readyState = EventSource.CLOSED;
    this.dispatchEvent({
      type: "close"
    });
  }

  __connnect() {
    if (this.readyState === EventSource.CLOSED) {
      // don't attempt to reestablish connection when the source is closed
      return;
    }

    if (this._lastEventId) {
      this._headers["Last-Event-ID"] = this._lastEventId;
    }

    _reactNative.Networking.sendRequest(
      "GET", // EventSource always GETs the resource
      this._trackingName,
      this.url,
      this._headers,
      "", // body for EventSource request is always empty
      "text", // SSE is a text protocol
      true, // we want incremental events
      0, // there is no timeout defined in the WHATWG spec for EventSource
      this.__didCreateRequest.bind(this),
      this.withCredentials
    );
  }

  __reconnect(reason) {
    this.readyState = EventSource.CONNECTING;
    let errorEventMessage = "reestablishing connection";

    if (reason) {
      errorEventMessage += ": " + reason;
    }

    this.dispatchEvent({
      type: "error",
      data: errorEventMessage
    });

    if (this.reconnectIntervalMs > 0) {
      setTimeout(this.__connnect.bind(this), this.reconnectIntervalMs);
    } else {
      this.__connnect();
    }
  } // Internal buffer processing methods

  __processEventStreamChunk(chunk) {
    if (this._isFirstChunk) {
      if (
        bom.every((charCode, idx) => {
          return this._lineBuf.charCodeAt(idx) === charCode;
        })
      ) {
        // Strip byte order mark from chunk
        chunk = chunk.slice(bom.length);
      }

      this._isFirstChunk = false;
    }

    let pos = 0;

    while (pos < chunk.length) {
      if (this._discardNextLineFeed) {
        if (chunk.charCodeAt(pos) === lf) {
          // Ignore this LF since it was preceded by a CR
          ++pos;
        }

        this._discardNextLineFeed = false;
      }

      const curCharCode = chunk.charCodeAt(pos);

      if (curCharCode === cr || curCharCode === lf) {
        this.__processEventStreamLine(); // Treat CRLF properly

        if (curCharCode === cr) {
          this._discardNextLineFeed = true;
        }
      } else {
        this._lineBuf += chunk.charAt(pos);
      }

      ++pos;
    }
  }

  __processEventStreamLine() {
    const line = this._lineBuf; // clear the line buffer

    this._lineBuf = ""; // Dispatch the buffered event if this is an empty line

    if (line === "") {
      this.__dispatchBufferedEvent();

      return;
    }

    const colonPos = line.indexOf(":");
    let field;
    let value;

    if (colonPos === 0) {
      // this is a comment line and should be ignored
      return;
    } else if (colonPos > 0) {
      if (line[colonPos + 1] === " ") {
        field = line.slice(0, colonPos);
        value = line.slice(colonPos + 2); // ignores the first space from the value
      } else {
        field = line.slice(0, colonPos);
        value = line.slice(colonPos + 1);
      }
    } else {
      field = line;
      value = "";
    }

    switch (field) {
      case "event":
        // Set the type of this event
        this._eventTypeBuf = value;
        break;

      case "data":
        // Append the line to the data buffer along with an LF (U+000A)
        this._dataBuf += value;
        this._dataBuf += String.fromCodePoint(lf);
        break;

      case "id":
        // Update the last seen event id
        this._lastEventIdBuf = value;
        break;

      case "retry":
        // Set a new reconnect interval value
        // But I don't like this.

        // eslint-disable-next-line no-case-declarations
        const newRetryMs = parseInt(value, 10);

        if (!isNaN(newRetryMs)) {
          this.reconnectIntervalMs = newRetryMs;
        }

        break;

      default: // this is an unrecognized field, so this line should be ignored
    }
  }

  __dispatchBufferedEvent() {
    this._lastEventId = this._lastEventIdBuf; // If the data buffer is an empty string, set the event type buffer to
    // empty string and return

    if (this._dataBuf === "") {
      this._eventTypeBuf = "";
      return;
    } // Dispatch the event

    const eventType = this._eventTypeBuf || "message";
    this.dispatchEvent({
      type: eventType,
      data: this._dataBuf.slice(0, -1),
      // remove the trailing LF from the data
      origin: this.url,
      lastEventId: this._lastEventId
    }); // Reset the data and event type buffers

    this._dataBuf = "";
    this._eventTypeBuf = "";
  } // Networking callbacks, exposed for testing

  __didCreateRequest(requestId) {
    this._requestId = requestId;
  }

  __didReceiveResponse(requestId, status, responseHeaders) {
    if (requestId !== this._requestId) {
      return;
    }

    if (responseHeaders) {
      // make the header names case insensitive
      for (const entry of Object.entries(responseHeaders)) {
        const [key, value] = entry;
        delete responseHeaders[key];
        responseHeaders[key.toLowerCase()] = value;
      }
    } // Handle redirects

    if (status === 301 || status === 307) {
      if (responseHeaders && responseHeaders.location) {
        // set the new URL, set the requestId to null so that request
        // completion doesn't attempt a reconnect, and immediately attempt
        // reconnecting
        this.url = responseHeaders.location;
        this._requestId = null;

        this.__connnect();

        return;
      } else {
        this.dispatchEvent({
          type: "error",
          data: "got redirect with no location"
        });
        return this.close();
      }
    }

    if (status !== 200) {
      this.dispatchEvent({
        type: "error",
        data: "unexpected HTTP status " + status
      });
      return this.close();
    }

    if (
      responseHeaders &&
      responseHeaders["content-type"] !== "text/event-stream"
    ) {
      this.dispatchEvent({
        type: "error",
        data:
          "unsupported MIME type in response: " +
          responseHeaders["content-type"]
      });
      return this.close();
    } else if (!responseHeaders) {
      this.dispatchEvent({
        type: "error",
        data: "no MIME type in response"
      });
      return this.close();
    } // reset the connection retry attempt counter

    this._retryAttempts = 0; // reset the stream processing buffers

    this._isFirstChunk = false;
    this._discardNextLineFeed = false;
    this._lineBuf = "";
    this._dataBuf = "";
    this._eventTypeBuf = "";
    this._lastEventIdBuf = "";
    this.readyState = EventSource.OPEN;
    this.dispatchEvent({
      type: "open"
    });
  }

  __didReceiveIncrementalData(requestId, responseText) {
    if (requestId !== this._requestId) {
      return;
    }

    this.__processEventStreamChunk(responseText);
  }

  __didCompleteResponse(requestId, error) {
    if (requestId !== this._requestId) {
      return;
    } // The spec states: 'Network errors that prevents the connection from being
    // established in the first place (e.g. DNS errors), should cause the user
    // agent to reestablish the connection in parallel, unless the user agent
    // knows that to be futile, in which case the user agent may fail the
    // connection.'
    //
    // We are treating 5 unnsuccessful retry attempts as a sign that attempting
    // to reconnect is 'futile'. Future improvements could also add exponential
    // backoff.

    if (this._retryAttempts < this.maxRetryAttempts) {
      // pass along the error message so that the user sees it as part of the
      // error event fired for re-establishing the connection
      this._retryAttempts += 1;

      this.__reconnect(error);
    } else {
      this.dispatchEvent({
        type: "error",
        data: "could not reconnect after " + this.maxRetryAttempts + " attempts"
      });
      this.close();
    }
  }
}

_defineProperty(EventSource, "CONNECTING", 0);

_defineProperty(EventSource, "OPEN", 1);

_defineProperty(EventSource, "CLOSED", 2);

_defineProperty(EventSource, "XMLHTTP_LOADING", 3);

_defineProperty(EventSource, "XMLHTTP_DONE", 4);

export default EventSource;

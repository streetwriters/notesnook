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
/* eslint-disable no-var */
/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import {
  precacheAndRoute,
  createHandlerBoundToURL,
  cleanupOutdatedCaches
} from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

declare var self: ServiceWorkerGlobalScope & typeof globalThis;

clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = new RegExp("/[^/?]+\\.[^/]+$");
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({ request, url }) => {
    // If this isn't a navigation, skip.
    if (request.mode !== "navigate") {
      return false;
    } // If this is a URL that starts with /_, skip.

    if (url.pathname.startsWith("/_")) {
      return false;
    } // If this looks like a URL for a resource, because it contains // a file extension, skip.

    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    } // Return true to signal that we want to use the handler.

    return true;
  },
  createHandlerBoundToURL(PUBLIC_URL + "/index.html")
);

// An example runtime caching route for requests that aren't handled by the
// precache, in this case same-origin .png requests like those from in public/
registerRoute(
  // Add in any other file extensions or routing criteria as needed.
  ({ url }) =>
    url.origin === self.location.origin && url.pathname.endsWith(".png"), // Customize this strategy as needed, e.g., by changing to CacheFirst.
  new StaleWhileRevalidate({
    cacheName: "images",
    plugins: [
      // Ensure that once this runtime cache reaches a maximum size the
      // least-recently used images are removed.
      new ExpirationPlugin({ maxEntries: 50 })
    ]
  })
);

const downloads = new Map<string, any[]>();

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener("message", (event) => {
  const { data } = event;
  if (!data) return;

  switch (data.type) {
    // We send a heartbeat every x second to keep the
    // service worker alive if a transferable stream is not sent
    case "PING":
      break;
    case "SKIP_WAITING":
      self.skipWaiting();
      break;
    case "GET_VERSION":
      {
        if (!event.source) return;
        event.source.postMessage({
          type: data.type,
          version: APP_VERSION,
          hash: GIT_HASH
        });
      }
      break;
    case "REGISTER_DOWNLOAD":
      {
        console.log("register download", data);
        const downloadUrl =
          data.url ||
          self.registration.scope +
            Math.random() +
            "/" +
            (typeof data === "string" ? data : data.filename);
        const port = event.ports[0];
        const metadata = new Array(3); // [stream, data, port]

        metadata[1] = data;
        metadata[2] = port;

        if (event.data.transferringReadable) {
          port.onmessage = (evt) => {
            port.onmessage = null;
            metadata[0] = evt.data.readableStream;
          };
        } else {
          metadata[0] = createStream(port);
        }

        downloads.set(downloadUrl, metadata);
        port.postMessage({ download: downloadUrl });
      }
      break;
    default:
      break;
  }
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // this only works for Firefox
  if (url.endsWith("/ping")) {
    return event.respondWith(new Response("pong"));
  }

  const metadata = downloads.get(url);
  if (!metadata) return null;

  const [stream, data, port] = metadata;

  downloads.delete(url);

  // Not comfortable letting any user control all headers
  // so we only copy over the length & disposition
  const responseHeaders = new Headers({
    "Content-Type": "application/octet-stream; charset=utf-8",

    // To be on the safe side, The link can be opened in a iframe.
    // but octet-stream should stop it.
    "Content-Security-Policy": "default-src 'none'",
    "X-Content-Security-Policy": "default-src 'none'",
    "X-WebKit-CSP": "default-src 'none'",
    "X-XSS-Protection": "1; mode=block"
  });

  const headers = new Headers(data.headers || {});

  if (headers.has("Content-Length")) {
    responseHeaders.set("Content-Length", headers.get("Content-Length")!);
  }

  if (headers.has("Content-Disposition")) {
    responseHeaders.set(
      "Content-Disposition",
      headers.get("Content-Disposition")!
    );
  }

  // data, data.filename and size should not be used anymore
  if (data.size) {
    console.warn("Depricated");
    responseHeaders.set("Content-Length", data.size);
  }

  let fileName = typeof data === "string" ? data : data.filename;
  if (fileName) {
    console.warn("Depricated");
    // Make filename RFC5987 compatible
    fileName = encodeURIComponent(fileName)
      .replace(/['()]/g, escape)
      .replace(/\*/g, "%2A");
    responseHeaders.set(
      "Content-Disposition",
      "attachment; filename*=UTF-8''" + fileName
    );
  }

  event.respondWith(new Response(stream, { headers: responseHeaders }));

  port.postMessage({ debug: "Download started" });
});

function createStream(port: MessagePort) {
  // ReadableStream is only supported by chrome 52
  return new ReadableStream({
    start(controller) {
      // When we receive data on the messageChannel, we write
      port.onmessage = ({ data }) => {
        if (data === "end") {
          return controller.close();
        }

        if (data === "abort") {
          controller.error("Aborted the download");
          return;
        }

        controller.enqueue(data);
      };
    },
    cancel(reason) {
      console.log("user aborted", reason);
      port.postMessage({ abort: true });
    }
  });
}

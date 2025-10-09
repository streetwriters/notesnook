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

import {
  precacheAndRoute,
  createHandlerBoundToURL,
  cleanupOutdatedCaches
} from "workbox-precaching";
import { setCacheNameDetails } from "workbox-core";
import { registerRoute } from "workbox-routing";
import "./service-worker.dev.js";

declare var self: ServiceWorkerGlobalScope & typeof globalThis;

setCacheNameDetails({
  prefix: IS_BETA ? "notesnook-beta" : "notesnook",
  suffix: `${self.registration.scope}-${APP_VERSION}-${GIT_HASH}`,
  precache: "precache",
  runtime: "runtime"
});

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

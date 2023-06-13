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
import { browser } from "webextension-polyfill-ts";
import { expose, Remote, wrap } from "comlink";
import { createEndpoint } from "../utils/comlink-extension";
import {
  Clip,
  Gateway,
  Server,
  WEB_EXTENSION_CHANNEL_EVENTS
} from "../common/bridge";

declare global {
  // eslint-disable-next-line no-var
  var clipperBridgeConnected: boolean;
}

function attachOnConnectListener() {
  browser.runtime.onConnect.addListener((port) => {
    window.addEventListener("message", (ev) => {
      const { type } = ev.data;
      switch (type) {
        case WEB_EXTENSION_CHANNEL_EVENTS.ON_CREATED:
          if (ev.ports.length) {
            const mainPort = ev.ports.at(0);
            if (mainPort) {
              expose(new BackgroundGateway(), mainPort);
              const server: Remote<Server> = wrap<Server>(mainPort);
              expose(
                {
                  login: () => server.login(),
                  getNotes: () => server.getNotes(),
                  getNotebooks: () => server.getNotebooks(),
                  getTags: () => server.getTags(),
                  saveClip: (clip: Clip) => server.saveClip(clip)
                },
                createEndpoint(port)
              );
              port.postMessage({ success: true });
            } else {
              port.postMessage({ success: false });
            }
          }
          break;
      }
    });

    window.postMessage({ type: WEB_EXTENSION_CHANNEL_EVENTS.ON_READY }, "*");
  });
}

class BackgroundGateway implements Gateway {
  connect() {
    return {
      name: "Web clipper",
      id: "unknown-id"
    };
  }
}

if (!globalThis.clipperBridgeConnected) {
  globalThis.clipperBridgeConnected = true;
  attachOnConnectListener();
}

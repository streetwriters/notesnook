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

import { expose, Remote, wrap } from "comlink";
import { updateStatus } from "../hooks/use-status";
import {
  Gateway,
  WEB_EXTENSION_CHANNEL_EVENTS
} from "@notesnook/web-clipper/dist/common/bridge";
import { Extension } from "../components/icons";

export class WebExtensionRelay {
  private gateway?: Remote<Gateway>;
  constructor() {
    window.addEventListener("message", async (ev) => {
      const { type } = ev.data;
      switch (type) {
        case WEB_EXTENSION_CHANNEL_EVENTS.ON_READY:
          this.gateway = undefined;
          await this.connect();
          break;
      }
    });
  }

  async connect(): Promise<boolean> {
    if (this.gateway) return true;
    const { WebExtensionServer } = await import("./web-extension-server");

    const channel = new MessageChannel();
    channel.port1.start();
    channel.port2.start();

    window.postMessage({ type: WEB_EXTENSION_CHANNEL_EVENTS.ON_CREATED }, "*", [
      channel.port2
    ]);

    const { port1 } = channel;

    expose(new WebExtensionServer(), port1);
    this.gateway = wrap(port1);

    const metadata = await this.gateway.connect();

    updateStatus({
      key: metadata.id,
      status: `${metadata.name} connected`,
      icon: Extension
    });

    return true;
  }
}

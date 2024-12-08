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
import {
  clipArticle,
  cleanup,
  clipPage,
  clipScreenshot,
  enterNodeSelectionMode
} from "@notesnook/clipper";
import { ClipArea, ClipMode } from "../common/bridge";
import type { Config } from "@notesnook/clipper/dist/types";

declare global {
  // eslint-disable-next-line no-var
  var messagingPortAttached: boolean;
}

type ClipMessage = {
  type: "clip";
  mode?: ClipMode;
  area?: ClipArea;
  settings?: Config;
};

type ViewportMessage = {
  type: "viewport";
};
function attachMessagePort() {
  if (globalThis.messagingPortAttached) return;
  globalThis.messagingPortAttached = true;

  browser.runtime.onMessage.addListener(async (request) => {
    const message = request as ClipMessage | ViewportMessage;

    switch (message.type) {
      case "clip": {
        const sizeable =
          message.area === "full-page" &&
          (message.mode === "complete" || message.mode === "screenshot");
        return {
          height: sizeable
            ? document.body.clientHeight ||
              document.firstElementChild?.scrollHeight ||
              1080
            : 0,
          width: sizeable
            ? document.body.clientWidth ||
              document.firstElementChild?.scrollWidth ||
              1920
            : 0,
          data: await clip(request)
        };
      }
      case "viewport":
        return {
          x: 0,
          y: 0,
          height: document.body.clientHeight,
          width: document.body.clientWidth
        };
      default:
        return false;
    }
  });
}

function clip(message: ClipMessage) {
  try {
    const config = message.settings;
    const isScreenshot = message.mode === "screenshot";
    const withStyles = message.mode === "complete" || isScreenshot;

    if (config) {
      config.styles = withStyles;
    }

    if (isScreenshot && message.area === "full-page") {
      return clipScreenshot(document.body, "jpeg", config);
    } else if (message.area === "full-page") {
      return clipPage(document, false, config);
    } else if (message.area === "selection") {
      enterNodeSelectionMode(document, config).then((result) =>
        browser.runtime.sendMessage({ type: "manual", data: result })
      );
    } else if (message.area === "article") {
      return clipArticle(document, config);
    } else if (message.area === "visible") {
      return clipPage(document, true, config);
    }
  } catch (e) {
    console.error(e);
  } finally {
    if (message.area !== "selection") cleanup();
  }
}

attachMessagePort();

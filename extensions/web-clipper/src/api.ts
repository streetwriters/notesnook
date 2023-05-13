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
import { browser, Runtime, Tabs } from "webextension-polyfill-ts";
import { Remote, wrap } from "comlink";
import { createEndpoint } from "./utils/comlink-extension";
import { Server } from "./common/bridge";
import { APP_URL, APP_URL_FILTER } from "./common/constants";

type WebExtensionChannelMessage = { success: boolean };

let api: Remote<Server> | undefined;
export async function connectApi(openNew = false, onDisconnect?: () => void) {
  if (api) return api;

  const tabs = await findNotesnookTabs(openNew);
  for (const tab of tabs) {
    try {
      const api = await Promise.race([
        connectToTab(tab, onDisconnect),
        timeout(5000)
      ]);
      if (!api) continue;
      return api as Remote<Server>;
    } catch (e) {
      console.error(e);
    }
  }

  return false;
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms, false));
}

function connectToTab(tab: Tabs.Tab, onDisconnect?: () => void) {
  return new Promise<Remote<Server> | false>(function connect(resolve) {
    if (!tab.id) return resolve(false);

    const port = browser.tabs.connect(tab.id);
    port.onDisconnect.addListener(() => {
      api = undefined;
      onDisconnect?.();
    });

    async function onMessage(
      message: WebExtensionChannelMessage,
      port: Runtime.Port
    ) {
      if (message.success) {
        port.onMessage.removeListener(onMessage);
        api = wrap<Server>(createEndpoint(port));
        resolve(api);
      } else {
        resolve(false);
      }
    }

    port.onMessage.addListener(onMessage);
  });
}

export async function findNotesnookTabs(openNew = false) {
  const tabs = await browser.tabs.query({
    url: APP_URL_FILTER,
    discarded: false,
    status: "complete"
  });

  if (tabs.length) return tabs;

  if (openNew) {
    const tab = await browser.tabs.create({ url: APP_URL, active: false });
    await new Promise<void>((resolve) =>
      browser.tabs.onUpdated.addListener(function onUpdated(id, info) {
        if (id === tab.id && info.status === "complete") {
          browser.tabs.onUpdated.removeListener(onUpdated);
          resolve();
        }
      })
    );
    return [tab];
  }
  return [];
}

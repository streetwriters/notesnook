import { browser, Runtime } from "webextension-polyfill-ts";
import { Remote, wrap } from "comlink";
import { createEndpoint } from "./utils/comlink-extension";
import { Server } from "./common/bridge";
import { APP_URL, APP_URL_FILTER } from "./common/constants";

let api: Remote<Server> | undefined;
export async function connectApi(openNew = false, onDisconnect?: () => void) {
  if (api) return api;

  const tab = await getTab(openNew);
  if (!tab || !tab.id) return false;

  return await new Promise<Remote<Server> | undefined>(function connect(
    resolve,
    reject
  ) {
    const port = browser.tabs.connect(tab.id!);

    port.onDisconnect.addListener(() => {
      api = undefined;
      onDisconnect?.();
    });

    async function onMessage(message: any, port: Runtime.Port) {
      if (message?.success) {
        port.onMessage.removeListener(onMessage);
        api = wrap<Server>(createEndpoint(port));
        resolve(api);
      } else {
        resolve(undefined);
      }
    }

    port.onMessage.addListener(onMessage);
  });
}

async function getTab(openNew = false) {
  const tabs = await browser.tabs.query({
    url: APP_URL_FILTER
  });

  if (tabs.length) return tabs[0];

  if (openNew) {
    const [tab] = await Promise.all([
      browser.tabs.create({ url: APP_URL, active: false }),
      new Promise((resolve) => {
        browser.runtime.onMessage.addListener((message) => {
          if (message.type === "start_connection") resolve(true);
        });
      })
    ]);
    return tab;
  }
  return undefined;
}

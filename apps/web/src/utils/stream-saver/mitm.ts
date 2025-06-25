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

let keepAlive = () => {
  keepAlive = () => {};
  const interval = setInterval(async () => {
    const { sw } = await findServiceWorker();
    if (sw) {
      sw.postMessage({ type: "PING" });
    } else {
      const ping =
        location.href.substr(0, location.href.lastIndexOf("/")) + "/ping";
      fetch(ping).then((res) => {
        !res.ok && clearInterval(interval);
        return res.text();
      });
    }
  }, 10000);
};

// Now that we have the Service Worker registered we can process messages
export async function postMessage(
  data: {
    origin?: string;
    referrer?: string;
    headers: Record<string, string>;
    pathname: string;
    url?: string;
    transferringReadable: boolean;
  },
  ports: MessagePort[]
) {
  const { scope, sw } = await findServiceWorker();
  if (!sw) throw new Error("No service worker registered.");

  // It's important to have a messageChannel, don't want to interfere
  // with other simultaneous downloads
  if (!ports || !ports.length) {
    throw new TypeError("[StreamSaver] You didn't send a messageChannel");
  }

  if (typeof data !== "object") {
    throw new TypeError("[StreamSaver] You didn't send a object");
  }

  // the default public service worker for StreamSaver is shared among others.
  // so all download links needs to be prefixed to avoid any other conflict
  data.origin = window.location.origin;

  // if we ever (in some feature version of streamsaver) would like to
  // redirect back to the page of who initiated a http request
  data.referrer = data.referrer || document.referrer || origin;

  // test if it's correct
  // should thorw a typeError if not
  new Headers(data.headers);

  // remove all leading slashes
  data.pathname = data.pathname.replace(/^\/+/g, "");

  // remove protocol
  const org = origin.replace(/(^\w+:|^)\/\//, "");

  // set the absolute pathname to the download url.
  data.url = new URL(`${scope + org}/${data.pathname}`).toString();

  if (!data.url.startsWith(`${scope + org}/`)) {
    throw new TypeError("[StreamSaver] bad `data.pathname`");
  }

  // This sends the message data as well as transferring
  // messageChannel.port2 to the service worker. The service worker can
  // then use the transferred port to reply via postMessage(), which
  // will in turn trigger the onmessage handler on messageChannel.port1.

  const transferable = [ports[0]];

  if (!data.transferringReadable) {
    keepAlive();
  }

  return sw.postMessage({ type: "REGISTER_DOWNLOAD", ...data }, transferable);
}

export function register() {
  // FF v102 just started to supports transferable streams, but still needs to ping sw.js
  // even tough the service worker dose not have to do any kind of work and listen to any
  // messages... #305
  keepAlive();
}

export async function findServiceWorker(): Promise<{
  sw?: ServiceWorker;
  scope?: string;
}> {
  if (!("serviceWorker" in navigator)) return {};

  const registrations =
    (await navigator.serviceWorker?.getRegistrations()) || [];
  for (const registration of registrations) {
    if (registration.active)
      return { sw: registration.active, scope: registration.scope };
  }

  return {};
}

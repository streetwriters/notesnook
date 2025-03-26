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

export type Platforms = "web" | "desktop";
export type AppVersion = typeof appVersion;
export const appVersion = {
  formatted: format(APP_VERSION, GIT_HASH, PLATFORM),
  clean: APP_VERSION,
  numerical: versionAsNumber(APP_VERSION),
  hash: GIT_HASH,
  isBeta: IS_BETA
};

function format(version?: string, hash?: string, type?: "web" | "desktop") {
  return `${version}-${hash}-${type}`;
}

function versionAsNumber(version: string) {
  return parseInt(version.replace(/\D/g, ""));
}

export function getServiceWorkerVersion(
  serviceWorker: ServiceWorker
): Promise<AppVersion> {
  return new Promise((resolve) => {
    function onMessage(ev: MessageEvent) {
      const { type } = ev.data;
      if (type !== "GET_VERSION") return;

      navigator.serviceWorker.removeEventListener("message", onMessage);
      const { version, hash, isBeta } = ev.data;
      resolve({
        formatted: format(version, hash, PLATFORM),
        numerical: versionAsNumber(version),
        clean: version,
        hash,
        isBeta
      });
    }

    navigator.serviceWorker.addEventListener("message", onMessage);
    serviceWorker.postMessage({ type: "GET_VERSION" });
  });
}

export { getChangelog } from "./changelog";

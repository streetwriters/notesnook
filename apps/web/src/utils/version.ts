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
  formatted: format(
    process.env.REACT_APP_VERSION,
    process.env.REACT_APP_GIT_HASH,
    process.env.REACT_APP_PLATFORM as Platforms,
    process.env.REACT_APP_BETA === "true"
  ),
  clean: formatVersion(process.env.REACT_APP_VERSION),
  numerical: parseInt(process.env.REACT_APP_VERSION || "0"),
  isBeta: process.env.REACT_APP_BETA === "true"
};

function format(
  version?: string,
  hash?: string,
  type?: "web" | "desktop",
  beta?: boolean
) {
  return `${formatVersion(version)}-${hash}-${type}${beta ? "-beta" : ""}`;
}

function formatVersion(version?: string) {
  if (!version) return "";
  const [major, minor, bugfix0, bugfix1] = version.toString().split("");
  return `${major}.${minor}.${bugfix0}${bugfix1 || ""}`;
}

export function getServiceWorkerVersion(
  serviceWorker: ServiceWorker
): Promise<AppVersion> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject("Service worker did not respond."),
      10 * 1000
    );
    navigator.serviceWorker.addEventListener("message", (ev) => {
      const { type } = ev.data;
      if (type !== "GET_VERSION") return;
      clearTimeout(timeout);

      const { version } = ev.data;
      resolve({
        formatted: formatVersion(version),
        numerical: parseInt(version),
        clean: formatVersion(version),
        isBeta: appVersion.isBeta
      });
    });
    serviceWorker.postMessage({ type: "GET_VERSION" });
  });
}

export { getChangelog } from "./changelog";

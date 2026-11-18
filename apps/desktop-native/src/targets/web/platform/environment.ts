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

import type { Environment, OperatingSystem } from "../../../platform";

function detectOs(): OperatingSystem {
  const agent = navigator.userAgent;
  if (/Mac/i.test(agent)) return "macOS";
  if (/Win/i.test(agent)) return "Windows";
  if (/Android/i.test(agent)) return "Android";
  if (/iPhone|iPad/i.test(agent)) return "iOS";
  if (/Linux/i.test(agent)) return "Linux";
  return null;
}

declare const IS_TESTING: boolean;

const os = detectOs();

export const environment: Environment = {
  platform: "web",
  isDesktopApp: false,
  isTesting: IS_TESTING,
  confirmInTesting(message) {
    window.confirm(message);
  },
  get isTestingPro() {
    return IS_TESTING && "isPro" in window;
  },
  isDev: import.meta.env.DEV || IS_TESTING,
  isBeta: false,
  appTitle: "Notesnook",
  version: "0.0.0-web",
  gitHash: "unknown",
  os,
  isMacStoreApp: false,
  hasNativeTitlebar: true,
  backupsDirectory: "",
  tempDirectory: "",
  locale: navigator.language,
  features: {
    opfs: false,
    cache: typeof caches !== "undefined",
    indexedDB: typeof indexedDB !== "undefined",
    clonableCryptoKey: true,
    applePaySupported: false,
    transferableStreams: false,
    print: false
  },
  describe() {
    return `Browser: ${navigator.userAgent}`;
  }
};

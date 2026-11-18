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

import type { DesktopIntegration, Integration } from "../../../platform";
import { config } from "./config";

function notImplemented(name: string): never {
  throw new Error(`integration.${name} is not implemented on web`);
}

const scheme = window.matchMedia("(prefers-color-scheme: dark)");

export const integration: Integration = {
  isFlatpak: async () => false,
  isSnap: async () => false,
  isPortable: async () => false,
  getDesktopIntegration: async () =>
    config.get<DesktopIntegration>("desktopIntegration", {}),
  setDesktopIntegration: async () => notImplemented("setDesktopIntegration"),
  getPrivacyMode: async () => false,
  setPrivacyMode: async () => notImplemented("setPrivacyMode"),
  getCustomDns: async () => false,
  setCustomDns: async () => notImplemented("setCustomDns"),
  getZoomFactor: async () => 1,
  setZoomFactor: async () => notImplemented("setZoomFactor"),
  getProxyRules: async () => "",
  setProxyRules: async () => notImplemented("setProxyRules"),
  getBackupDirectory: async () => "",
  selectBackupDirectory: async () => notImplemented("selectBackupDirectory"),
  async setAppLanguage(language) {
    config.set("appLanguage", language);
  },
  async changeTheme() {},
  getSystemTheme: async () => (scheme.matches ? "dark" : "light"),
  onSystemThemeChanged(handler) {
    const listener = (event: MediaQueryListEvent) =>
      handler(event.matches ? "dark" : "light");
    scheme.addEventListener("change", listener);
    return () => scheme.removeEventListener("change", listener);
  },
  onOpenLink: () => () => {},
  onLaunchRequest: () => () => {},
  async start() {},
  async beep() {}
};

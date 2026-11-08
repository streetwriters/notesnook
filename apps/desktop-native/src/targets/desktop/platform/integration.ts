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

import { Appearance, Linking } from "react-native";
import {
  isContentProtected,
  setContentProtected,
  setLaunchAtLogin
} from "@react-native-gpui/system";
import fs, { dialog } from "@react-native-gpui/fs";
import type { DesktopIntegration, Integration } from "../../../platform";
import { config } from "./config";
import { environment } from "./environment";

const KEYS = {
  desktopIntegration: "desktopIntegration",
  privacyMode: "privacyMode",
  customDns: "customDns",
  zoomFactor: "zoomFactor",
  proxyRules: "proxyRules",
  backupDirectory: "backupStorageLocation",
  language: "appLanguage"
};

export const integration: Integration = {
  isFlatpak: async () => false,
  isSnap: async () => false,
  isPortable: async () => false,
  getDesktopIntegration: async () =>
    config.get<DesktopIntegration>(KEYS.desktopIntegration, {}),
  async setDesktopIntegration(settings) {
    const next = {
      ...config.get<DesktopIntegration>(KEYS.desktopIntegration, {}),
      ...settings
    };
    config.set(KEYS.desktopIntegration, next);
    if (
      settings.autoStart !== undefined ||
      settings.startMinimized !== undefined
    )
      await setLaunchAtLogin(!!next.autoStart, {
        hidden: !!next.startMinimized
      });
  },
  getPrivacyMode: () => isContentProtected(),
  async setPrivacyMode(enabled) {
    config.set(KEYS.privacyMode, enabled);
    await setContentProtected(enabled);
  },
  getCustomDns: async () => config.get<boolean>(KEYS.customDns, true),
  async setCustomDns(enabled) {
    config.set(KEYS.customDns, enabled);
  },
  getZoomFactor: async () => config.get<number>(KEYS.zoomFactor, 1),
  async setZoomFactor(zoomFactor) {
    config.set(KEYS.zoomFactor, zoomFactor);
  },
  getProxyRules: async () => config.get<string>(KEYS.proxyRules, ""),
  async setProxyRules(proxyRules) {
    config.set(KEYS.proxyRules, proxyRules);
  },
  getBackupDirectory: async () =>
    config.get<string>(KEYS.backupDirectory, environment.backupsDirectory),
  async selectBackupDirectory() {
    const [selected] = await dialog.open({
      directory: true,
      defaultPath: config.get<string>(
        KEYS.backupDirectory,
        environment.backupsDirectory
      )
    });
    if (!selected) return undefined;
    await fs.promises.mkdir(selected, { recursive: true });
    config.set(KEYS.backupDirectory, selected);
    return selected;
  },
  async setAppLanguage(language) {
    config.set(KEYS.language, language);
  },
  async changeTheme() {},
  getSystemTheme: async () =>
    Appearance.getColorScheme() === "dark" ? "dark" : "light",
  onSystemThemeChanged(handler) {
    const subscription = Appearance.addChangeListener(({ colorScheme }) =>
      handler(colorScheme === "dark" ? "dark" : "light")
    );
    return () => subscription.remove();
  },
  onOpenLink(handler) {
    const subscription = Linking.addEventListener("url", ({ url }) =>
      handler(url)
    );
    return () => subscription.remove();
  }
};

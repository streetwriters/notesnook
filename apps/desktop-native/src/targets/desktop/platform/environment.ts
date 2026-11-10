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

import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { paths } from "@react-native-gpui/fs";
import type { Environment, OperatingSystem } from "../../../platform";

const OPERATING_SYSTEMS: Record<string, OperatingSystem> = {
  macos: "macOS",
  windows: "Windows",
  linux: "Linux"
};

const os = OPERATING_SYSTEMS[Platform.OS] ?? null;

export const environment: Environment = {
  platform: "desktop",
  isDesktopApp: true,
  isTesting: !!(Platform.constants as { isTesting?: boolean }).isTesting,
  isDev: __DEV__,
  isBeta: false,
  appTitle: "Notesnook",
  version: DeviceInfo.getVersion(),
  gitHash: "unknown",
  os,
  isMacStoreApp: false,
  hasNativeTitlebar: false,
  get backupsDirectory() {
    return `${paths.documents}/Notesnook/backups`;
  },
  get tempDirectory() {
    return paths.temp;
  },
  locale: undefined,
  features: {
    opfs: false,
    cache: false,
    indexedDB: false,
    clonableCryptoKey: true,
    applePaySupported: false,
    transferableStreams: false,
    print: false
  },
  describe() {
    return `OS: ${os ?? Platform.OS} ${DeviceInfo.getSystemVersion()}`;
  }
};

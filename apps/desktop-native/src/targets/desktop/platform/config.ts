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

import { MMKVLoader } from "react-native-mmkv-storage";
import type { Config } from "../../../platform";
import { tryParse } from "../../../app/utils/parse";

const storage = new MMKVLoader()
  .withInstanceID("notesnook_config")
  .disableIndexing()
  .initialize();

const KEPT_ON_LOGOUT = [
  "editorConfig",
  "backupStorageLocation",
  "serverUrls",
  "corsProxy",
  "theme:light",
  "theme:dark",
  "colorScheme",
  "followSystemTheme",
  "doubleSpacedLines",
  "appLanguage",
  "appLockEnabled"
];

function set<T>(key: string, value: T) {
  storage.setString(key, JSON.stringify(value));
  return value;
}

function get<T>(key: string, def?: T): T {
  const value = storage.getString(key);
  if (!value && def !== undefined) return def;
  return value ? tryParse(value) : (def as T);
}

export const config: Config = {
  set,
  get,
  remove: (key) => {
    storage.removeItem(key);
  },
  clear: () => {
    storage.clearStore();
  },
  logout() {
    const kept: Record<string, unknown> = {};
    for (const key of KEPT_ON_LOGOUT) {
      const value = get(key);
      if (value !== undefined) kept[key] = value;
    }
    storage.clearStore();
    for (const key in kept) set(key, kept[key]);
  }
};

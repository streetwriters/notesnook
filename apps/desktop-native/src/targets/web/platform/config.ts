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

import type { Config } from "../../../platform";

import {
  KEPT_ON_LOGOUT,
  WEB_CONFIG_PREFIX
} from "../../../shared/storage-constants";

const PREFIX = WEB_CONFIG_PREFIX;

function read<T>(key: string): T | undefined {
  const value = localStorage.getItem(PREFIX + key);
  if (value === null) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  return value;
}

function get<T>(key: string, def?: T): T {
  const value = read<T>(key);
  return value === undefined ? (def as T) : value;
}

function clear() {
  for (const key of Object.keys(localStorage))
    if (key.startsWith(PREFIX)) localStorage.removeItem(key);
}

export const config: Config = {
  set,
  get,
  remove: (key) => {
    localStorage.removeItem(PREFIX + key);
  },
  clear,
  logout() {
    const kept: Record<string, unknown> = {};
    for (const key of KEPT_ON_LOGOUT) {
      const value = read(key);
      if (value !== undefined) kept[key] = value;
    }
    clear();
    for (const key in kept) set(key, kept[key]);
  }
};

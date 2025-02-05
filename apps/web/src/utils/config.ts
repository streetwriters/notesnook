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

import { tryParse } from "./parse";

function set<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function get<T>(key: string, def?: T): T {
  const value = window.localStorage.getItem(key);
  if (!value && def !== undefined) return def;
  return value ? tryParse(value) : def;
}

function remove(key: string) {
  window.localStorage.removeItem(key);
}

function clear() {
  window.localStorage.clear();
}

function all<T>(): Record<string, T> {
  const data: Record<string, T> = {};
  for (let i = 0; i < window.localStorage.length; ++i) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    data[key] = get(key);
  }
  return data;
}

function has(predicate: (key: string) => boolean) {
  for (let i = 0; i < window.localStorage.length; ++i) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (predicate(key)) return true;
  }
  return false;
}

function logout() {
  const toKeep = [
    "editorConfig",
    "backupStorageLocation",
    "serverUrls",
    "corsProxy",
    "theme:light",
    "theme:dark",
    "colorScheme",
    "followSystemTheme"
  ];
  const vals = {} as Record<string, any>;

  for (const keep of toKeep) {
    const val = get(keep);
    if (val !== undefined) vals[keep] = val;
  }

  clear();

  for (const key in vals) {
    set(key, vals[key]);
  }
}

const Config = { set, get, clear, all, has, remove, logout };
export default Config;

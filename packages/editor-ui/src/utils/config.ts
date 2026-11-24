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

// Hosts without `localStorage` (the native app) keep the values in memory.
const memory = new Map<string, string>();
const storage = {
  getItem: (key: string): string | null =>
    typeof window !== "undefined" && window.localStorage
      ? window.localStorage.getItem(key)
      : (memory.get(key) ?? null),
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined" && window.localStorage)
      window.localStorage.setItem(key, value);
    else memory.set(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined" && window.localStorage)
      window.localStorage.removeItem(key);
    else memory.delete(key);
  }
};

function set<T>(key: string, value: T | null) {
  if (!value) return storage.removeItem(key);
  storage.setItem(key, JSON.stringify(value));
}

function get<T>(key: string, def?: T): T | undefined {
  const value = storage.getItem(key);
  if (!value) return def;

  return tryParse(value) as T;
}

export const config = { set, get };

function tryParse<T>(val: string): T | string | undefined {
  if (val === "undefined" || val === "null") return;

  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}

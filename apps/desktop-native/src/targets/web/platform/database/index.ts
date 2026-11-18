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

import { EventSourcePolyfill } from "event-source-polyfill";
import { createDialect } from "web-app-sqlite";
import type { DatabaseHost } from "../../../../platform";
import { compression } from "../compression";
import { createStorage } from "./storage";
import { WEB_DATABASE_KEY } from "../../../../shared/storage-constants";

const DB_KEY = WEB_DATABASE_KEY;

function generateKey() {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&+_{}[]():<>/?;";
  const indexes = globalThis.crypto.getRandomValues(new Uint32Array(80));
  return Array.from(indexes, (index) => charset[index % charset.length]).join(
    ""
  );
}

function getDatabaseKey() {
  let key = localStorage.getItem(DB_KEY);
  if (!key) {
    key = generateKey();
    localStorage.setItem(DB_KEY, key);
  }
  return key;
}

export const databaseHost: DatabaseHost = {
  createDialect: ({ name, encrypted }) =>
    createDialect({
      name,
      encrypted,
      async: true,
      multiTab: false
    }),
  journalMode: "WAL",
  lockingMode: "exclusive",
  createStorage: async (persistence) => createStorage(persistence),
  getDatabaseKey: async () => getDatabaseKey(),
  disableAppLock: async () => {
    throw new Error("App lock is not implemented on web");
  },
  async delete() {
    localStorage.removeItem(DB_KEY);
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase("notesnook");
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    });
  },
  eventSource: EventSourcePolyfill as unknown as DatabaseHost["eventSource"],
  compression
};

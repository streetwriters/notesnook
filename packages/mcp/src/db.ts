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

import { Database, IFileStorage } from "@notesnook/core";
import { SqliteDialect } from "@streetwriters/kysely";
import BetterSQLite3 from "better-sqlite3-multiple-ciphers";
import { mkdirSync } from "fs";
import { homedir } from "os";
import path from "path";
import * as betterTrigram from "sqlite-better-trigram";
import * as fts5Html from "sqlite3-fts5-html";
import { DOMParser } from "linkedom";
import { NodeStorageInterface } from "./storage.js";

// Core's HTML export pipeline calls document.createElement via DOMParser.
// Polyfill it for the Node.js environment using linkedom.
if (!("DOMParser" in globalThis)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMParser = DOMParser;
}

const DEFAULT_DATA_DIR = path.join(homedir(), ".notesnook-mcp");

export function getDataDir(): string {
  return process.env.NOTESNOOK_DATA_DIR ?? DEFAULT_DATA_DIR;
}

export async function createDatabase(dataDir: string): Promise<Database> {
  mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "db.sqlite");
  const sqliteDb = BetterSQLite3(dbPath).unsafeMode(true);

  betterTrigram.load(sqliteDb);
  fts5Html.load(sqliteDb);

  // Load sqlite-regex extension via dynamic import (no type declarations)
  const { getLoadablePath } = (await import("sqlite-regex")) as unknown as {
    getLoadablePath: () => string;
  };
  sqliteDb.loadExtension(getLoadablePath());

  const storage = new NodeStorageInterface(sqliteDb);

  // eventsource provides an EventSource implementation for Node.js
  const EventSourceImpl = (
    (await import("eventsource")) as unknown as {
      default: typeof EventSource;
    }
  ).default;

  const db = new Database();
  db.setup({
    storage,
    eventsource: EventSourceImpl,
    fs: createNoopFileStorage(),
    compressor: async () => createNoopCompressor(),
    maxNoteVersions: async () => 1000,
    sqliteOptions: {
      // Both mcp and core depend on @streetwriters/kysely. In a non-hoisted
      // monorepo setup each package gets its own copy, causing nominal type
      // incompatibility even though the implementations are identical. The
      // `as any` cast is intentional and safe at runtime.
      /* eslint-disable @typescript-eslint/no-explicit-any */
      dialect: (_name: string) =>
        new SqliteDialect({ database: sqliteDb }) as any,
      /* eslint-enable @typescript-eslint/no-explicit-any */
      password: undefined
    },
    batchSize: 500
  });

  return db;
}

function createNoopFileStorage(): IFileStorage {
  return {
    writeEncryptedBase64: async () => {
      throw new Error("File storage not supported in MCP server");
    },
    readEncrypted: async () => undefined,
    uploadFile: (_filename, _opts) => ({
      execute: async () => false,
      cancel: async () => {}
    }),
    downloadFile: (_filename, _opts) => ({
      execute: async () => false,
      cancel: async () => {}
    }),
    deleteFile: async () => false,
    bulkDeleteFiles: async () => false,
    exists: async () => false,
    bulkExists: async () => [],
    getUploadedFileSize: async () => 0,
    clearFileStorage: async () => {},
    hashBase64: async () => ({ hash: "", type: "xxh64" })
  };
}

function createNoopCompressor() {
  return {
    compress: async (data: string) => data,
    decompress: async (data: string) => data
  };
}

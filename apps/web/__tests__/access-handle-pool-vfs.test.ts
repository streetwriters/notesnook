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

import { readFileSync } from "fs";
import path from "path";
import { expect, test, vi } from "vitest";
import SQLiteSyncESMFactory from "../src/common/sqlite/wa-sqlite";
import { Factory, SQLITE_FULL } from "../src/common/sqlite/sqlite-api";
import { AccessHandlePoolVFS } from "../src/common/sqlite/AccessHandlePoolVFS";

function createQuotaLimitedOPFS(quota: number) {
  const files = new Map<string, Uint8Array>();
  const usage = () =>
    Array.from(files.values()).reduce((sum, f) => sum + f.byteLength, 0);

  function accessHandle(name: string) {
    return {
      read(buffer: ArrayBufferView, { at }: { at: number }) {
        const data = files.get(name)!;
        const view = new Uint8Array(
          buffer.buffer,
          buffer.byteOffset,
          buffer.byteLength
        );
        const chunk = data.subarray(at, at + view.byteLength);
        view.set(chunk);
        return chunk.byteLength;
      },
      write(buffer: ArrayBufferView, { at }: { at: number }) {
        const data = files.get(name)!;
        const end = at + buffer.byteLength;
        if (end > data.byteLength) {
          if (usage() + end - data.byteLength > quota)
            throw new DOMException(
              "The operation failed because it would cause the application to exceed its storage quota.",
              "QuotaExceededError"
            );
          const grown = new Uint8Array(end);
          grown.set(data);
          files.set(name, grown);
        }
        files
          .get(name)!
          .set(
            new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
            at
          );
        return buffer.byteLength;
      },
      truncate(size: number) {
        const data = files.get(name)!;
        const resized = new Uint8Array(size);
        resized.set(data.subarray(0, size));
        files.set(name, resized);
      },
      getSize: () => files.get(name)!.byteLength,
      flush() {},
      close() {}
    };
  }

  const directory = {
    kind: "directory",
    async getDirectoryHandle() {
      return directory;
    },
    async getFileHandle(name: string) {
      if (!files.has(name)) files.set(name, new Uint8Array(0));
      return {
        kind: "file",
        createSyncAccessHandle: async () => accessHandle(name)
      };
    },
    async removeEntry(name: string) {
      files.delete(name);
    },
    async *entries() {
      for (const name of files.keys())
        yield [name, await directory.getFileHandle(name)];
    }
  };
  return directory;
}

test("sqlite reports SQLITE_FULL and stays usable when OPFS quota is exceeded", async () => {
  vi.stubGlobal("navigator", {
    storage: { getDirectory: async () => createQuotaLimitedOPFS(512 * 1024) }
  });

  const wasmBinary = readFileSync(
    path.join(__dirname, "../src/common/sqlite/wa-sqlite.wasm")
  );
  const sqlite = Factory(await SQLiteSyncESMFactory({ wasmBinary }));
  const vfs = new AccessHandlePoolVFS("test");
  await vfs.isReady;
  sqlite.vfs_register(vfs, false);
  const db = await sqlite.open_v2("test.db", undefined, vfs.name);

  await sqlite.exec(db, "CREATE TABLE content (id INTEGER, data BLOB)");

  let error: unknown;
  for (let i = 0; i < 64 && !error; ++i) {
    await sqlite
      .exec(db, `INSERT INTO content VALUES (${i}, randomblob(64 * 1024))`)
      .catch((e: unknown) => (error = e));
  }
  expect(error).toMatchObject({ code: SQLITE_FULL });

  for (let i = 0; i < 3; ++i) {
    await expect(
      sqlite.exec(db, `INSERT INTO content VALUES (${i}, randomblob(64 * 1024))`)
    ).rejects.toMatchObject({ code: SQLITE_FULL });
  }

  await sqlite.exec(db, "BEGIN");
  expect(sqlite.get_autocommit(db)).toBe(0);
  await sqlite.exec(db, "INSERT INTO content VALUES (0, randomblob(64 * 1024))");
  await expect(sqlite.exec(db, "COMMIT")).rejects.toMatchObject({
    code: SQLITE_FULL
  });
  expect(sqlite.get_autocommit(db)).toBe(1);
  await expect(sqlite.exec(db, "ROLLBACK")).rejects.toThrow(
    "cannot rollback - no transaction is active"
  );

  const rows: unknown[] = [];
  await sqlite.exec(db, "SELECT count(*) FROM content", (row: unknown[]) =>
    rows.push(row[0])
  );
  expect(rows[0]).toBeGreaterThan(0);
  await sqlite.exec(db, "INSERT INTO content VALUES (999, 'small')");
  await sqlite.close(db);
});

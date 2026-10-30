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


import { expect, test } from "vitest";
import { databaseTest, loginFakeUser } from "./utils";
import Database from "../src/api/index.js";

async function restoreWithDifferentKey(
  db: Database,
  local: { dateUploaded?: number; fileExists: boolean }
) {
  await loginFakeUser(db);

  const hash = await db.attachments.save(
    "iVBORw0KGgoAAAANSUhEUgAAAAEEAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "image/png",
    "test.png"
  );
  if (!hash) throw new Error("Failed to create attachment");
  const attachment = await db.attachments.attachment(hash);
  if (!attachment) throw new Error("Failed to find attachment");
  await db.attachments.collection.update([attachment.id], {
    dateUploaded: local.dateUploaded,
    chunkSize: 1
  });
  if (!local.fileExists) await db.fs().deleteFile(hash, true);

  const attachmentsKey = await db.user?.getAttachmentsKey();
  if (!attachmentsKey) throw new Error("Missing attachments key");
  const backupKey = await db
    .storage()
    .encrypt(attachmentsKey, JSON.stringify({ iv: "a", salt: "b", key: "c" }));

  const skipped = await (db.backup as any).migrateData(
    [
      {
        ...attachment,
        key: backupKey,
        iv: "new-iv",
        salt: "new-salt",
        chunkSize: 4096,
        dateUploaded: undefined
      }
    ],
    6.0,
    attachmentsKey
  );

  return {
    skipped,
    original: attachment,
    restored: await db.attachments.attachment(hash)
  };
}

test("restoring a backup attachment with a different key should keep the uploaded local attachment", () =>
  databaseTest().then(async (db) => {
    const dateUploaded = Date.now();
    const { skipped, original, restored } = await restoreWithDifferentKey(db, {
      dateUploaded,
      fileExists: true
    });

    expect(skipped).toEqual([original.hash]);
    expect(restored?.key).toEqual(original.key);
    expect(restored?.iv).toBe(original.iv);
    expect(restored?.chunkSize).toBe(1);
    expect(restored?.dateUploaded).toBe(dateUploaded);
  }));

test("restoring a backup attachment with a different key should adopt the backup key if local file is unavailable", () =>
  databaseTest().then(async (db) => {
    const { skipped, restored } = await restoreWithDifferentKey(db, {
      fileExists: false
    });

    expect(skipped).toEqual([]);
    expect(restored?.iv).toBe("new-iv");
    expect(restored?.chunkSize).toBe(4096);
    expect(restored?.dateUploaded).toBeFalsy();
  }));

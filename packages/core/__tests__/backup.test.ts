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

test("restoring a backup attachment with a different key should reset upload state", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const hash = await db.attachments.save(
      "iVBORw0KGgoAAAANSUhEUgAAAAEEAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "image/png",
      "test.png"
    );
    if (!hash) throw new Error("Failed to create attachment");
    const local = await db.attachments.attachment(hash);
    if (!local) throw new Error("Failed to find attachment");
    await db.attachments.collection.update([local.id], {
      dateUploaded: Date.now(),
      chunkSize: 1
    });

    const attachmentsKey = await db.user?.getAttachmentsKey();
    if (!attachmentsKey) throw new Error("Missing attachments key");
    const backupKey = await db
      .storage()
      .encrypt(
        attachmentsKey,
        JSON.stringify({ iv: "a", salt: "b", key: "c" })
      );

    await (db.backup as any).migrateData(
      [
        {
          ...local,
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

    const restored = await db.attachments.attachment(hash);
    expect(restored?.iv).toBe("new-iv");
    expect(restored?.chunkSize).toBe(4096);
    expect(restored?.dateUploaded).toBeFalsy();
  }));

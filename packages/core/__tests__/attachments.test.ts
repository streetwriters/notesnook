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

test("remove orphaned attachments should remove only orphaned attachments", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const hash1 = await db.attachments.save(
      "iVBORw0KGgoAAAANSUhEUgAAAAEEAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "image/png",
      "test.png"
    );
    if (!hash1) throw new Error("Failed to create attachment");
    const noteId = await db.notes.add({
      title: "Test Note"
    });
    const attachments = await db.attachments.all
      .fields(["attachments.id"])
      .where((eb) => eb("hash", "in", [hash1]))
      .items();
    await db.relations.add(
      {
        id: noteId,
        type: "note"
      },
      { id: attachments[0].id, type: "attachment" }
    );

    const hash = await db.attachments.save(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "image/png",
      "test.png"
    );
    if (!hash) throw new Error("Failed to create attachment");

    await db.attachments.removeOrphaned();

    expect(await db.attachments.exists(hash)).toBe(false);
    expect(await db.attachments.exists(hash1)).toBe(true);
    expect(await db.attachments.orphaned.count()).toBe(0);
  }));

async function addFakeAttachment(
  db: Awaited<ReturnType<typeof databaseTest>>,
  hash: string,
  mimeType: string
) {
  return db.attachments.add({
    hash,
    mimeType,
    size: 10,
    filename: hash,
    iv: "iv",
    salt: "salt",
    alg: "xcha-stream",
    hashType: "blake3",
    chunkSize: 512,
    key: await db.attachments.generateKey()
  });
}

test("documents filter matches office documents", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const noteId = await db.notes.add({ title: "note" });
    for (const [hash, mimeType] of [
      [
        "docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ],
      ["pdf", "application/pdf"],
      ["png", "image/png"]
    ]) {
      const id = await addFakeAttachment(db, hash, mimeType);
      await db.relations.add(
        { type: "note", id: noteId! },
        { type: "attachment", id: id! }
      );
    }

    expect(await db.attachments.documents.count()).toBe(2);
    expect(await db.attachments.ofNote(noteId!, "documents").count()).toBe(2);
  }));

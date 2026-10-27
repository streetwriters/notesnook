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

import { databaseTest, delay } from "../../../../__tests__/utils/index.js";
import { expect, test, vi } from "vitest";
import { CURRENT_DATABASE_VERSION } from "../../../common.js";
import { KEY_VERSION } from "../types.js";

test("merge should not overwrite a local edit made while merging", () =>
  databaseTest().then(async (db) => {
    const id = await db.notes.add({ title: "original" });
    const note = await db.notes.note(id);

    // the server sends a slightly newer version of the note
    const remote = {
      ...note,
      title: "remote",
      dateModified: note!.dateModified + 1
    };
    vi.spyOn(db.storage(), "decryptMulti").mockResolvedValue([
      JSON.stringify(remote)
    ]);

    // pause the merge right after it reads the local note
    let readLocalNote!: () => void;
    const localNoteRead = new Promise<void>((r) => (readLocalNote = r));
    const records = db.notes.collection.records;
    vi.spyOn(db.notes.collection, "records").mockImplementation(async function (
      this: any,
      ids
    ) {
      const result = await records.call(this, ids);
      readLocalNote();
      await delay(100);
      return result;
    });

    const merge = db.syncer.sync.processChunk(
      {
        type: "note",
        count: 1,
        items: [{ id, v: CURRENT_DATABASE_VERSION } as any]
      },
      [{ version: KEY_VERSION.LEGACY, key: {} as any }],
      { type: "full" }
    );

    // the user edits the note while the merge is paused
    await localNoteRead;
    await Promise.all([merge, db.notes.add({ id, title: "local edit" })]);

    expect((await db.notes.note(id))?.title).toBe("local edit");
  }));

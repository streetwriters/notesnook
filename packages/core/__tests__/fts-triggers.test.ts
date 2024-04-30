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
import { databaseTest } from "./utils";

test("updating deleted content should not throw", () =>
  databaseTest().then(async (db) => {
    const id = await db.notes.add({
      title: "New note"
    });

    const contentId = await db.content.add({
      data: "helloworld",
      noteId: id
    });

    await db.content.remove(contentId!);

    await expect(
      db.content.collection.update(
        [contentId!],
        { synced: true },
        { sendEvent: false }
      )
    ).resolves.toBeFalsy();
  }));

test("updating content should not break full text search", () =>
  databaseTest().then(async (db) => {
    const id = await db.notes.add({
      title: "New note"
    });

    const contentId = await db.content.add({
      data: "hello world",
      noteId: id
    });

    await db.content.add({
      id: contentId,
      data: "i am amazing",
      noteId: id
    });

    expect(await db.lookup.notes("amazing").ids()).toContain(id);
    expect(await db.lookup.notes("hello world").ids()).not.toContain(id);
  }));

test("updating note title should not break full text search", () =>
  databaseTest().then(async (db) => {
    const id = await db.notes.add({
      title: "New note"
    });
    await db.notes.add({
      id,
      title: "What an amazing note!"
    });
    expect(await db.lookup.notes("amazing").ids()).toContain(id);
    expect(await db.lookup.notes("new note").ids()).not.toContain(id);
  }));

test("updating deleted note should not throw", () =>
  databaseTest().then(async (db) => {
    const id = await db.notes.add({
      title: "New note"
    });
    await db.notes.remove(id);

    await expect(
      db.notes.collection.update([id], { synced: true }, { sendEvent: false })
    ).resolves.toBeFalsy();
  }));

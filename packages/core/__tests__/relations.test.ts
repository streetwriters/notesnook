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

import { databaseTest } from "./utils/index.js";
import { getId } from "../src/utils/id.js";
import Database from "../src/api/index.js";
import { test, expect } from "vitest";

// more than SQLite's max number of SQL variables (32766)
const HIDDEN_NOTES = 33000;

async function addHiddenNotes(
  db: Database,
  state: "archived" | "trashed",
  relatedTo: { id: string; type: "tag" | "notebook" }
) {
  const now = Date.now();
  const ids: string[] = [];
  for (let i = 0; i < HIDDEN_NOTES; i += 500) {
    const batch = Array.from({ length: 500 }, () => getId());
    await db
      .sql()
      .insertInto("notes")
      .values(
        batch.map((id) => ({
          id,
          type: state === "trashed" ? "trash" : "note",
          itemType: state === "trashed" ? "note" : undefined,
          deletedBy: state === "trashed" ? "user" : undefined,
          dateDeleted: state === "trashed" ? now : undefined,
          archived: state === "archived",
          dateCreated: now,
          dateEdited: now,
          dateModified: now
        }))
      )
      .execute();
    await db
      .sql()
      .insertInto("relations")
      .values(
        batch.map((id) => ({
          id: getId(),
          type: "relation",
          fromId: relatedTo.id,
          fromType: relatedTo.type,
          toId: id,
          toType: "note",
          dateCreated: now,
          dateModified: now
        }))
      )
      .execute();
    ids.push(...batch);
  }
  await db.trash.buildCache();
  return ids;
}

test("tag note count should exclude archived notes when there are too many", () =>
  databaseTest().then(async (db) => {
    const tagId = await db.tags.add({ title: "tag" });
    const noteId = await db.notes.add({ title: "visible" });
    await db.relations.add(
      { type: "tag", id: tagId },
      { type: "note", id: noteId }
    );
    await addHiddenNotes(db, "archived", { type: "tag", id: tagId });

    const notes = db.relations.from({ type: "tag", id: tagId }, "note");
    expect(await notes.count()).toBe(1);
    expect(await notes.selector.ids()).toEqual([noteId]);
  }));

test("tag note count should exclude trashed notes when there are too many", () =>
  databaseTest().then(async (db) => {
    const tagId = await db.tags.add({ title: "tag" });
    const noteId = await db.notes.add({ title: "visible" });
    await db.relations.add(
      { type: "tag", id: tagId },
      { type: "note", id: noteId }
    );
    await addHiddenNotes(db, "trashed", { type: "tag", id: tagId });

    const notes = db.relations.from({ type: "tag", id: tagId }, "note");
    expect(await notes.count()).toBe(1);
    expect(await notes.selector.ids()).toEqual([noteId]);
  }));

test("notebook notes should exclude trashed notes when there are too many", () =>
  databaseTest().then(async (db) => {
    const notebookId = await db.notebooks.add({ title: "notebook" });
    const noteId = await db.notes.add({ title: "visible" });
    await db.notes.addToNotebook(notebookId, noteId);
    await addHiddenNotes(db, "trashed", { type: "notebook", id: notebookId });

    expect(await db.notebooks.totalNotes(notebookId)).toEqual([1]);
    expect(await db.notebooks.notes(notebookId)).toEqual([noteId]);
  }));

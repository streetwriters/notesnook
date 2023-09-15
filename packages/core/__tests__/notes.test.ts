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

import Database from "../src/api";
import { groupArray } from "../src/utils/grouping";
import {
  databaseTest,
  noteTest,
  groupedTest,
  TEST_NOTE,
  TEST_NOTEBOOK,
  IMG_CONTENT,
  loginFakeUser
} from "./utils";
import { test, expect } from "vitest";

async function createAndAddNoteToNotebook(
  db: Database,
  noteId: string,
  options: {
    notebookTitle: string;
    subNotebookTitle: string;
  }
) {
  const { notebookTitle, subNotebookTitle } = options;
  const notebookId = await db.notebooks.add({ title: notebookTitle });
  if (!notebookId) throw new Error("Could not create notebook");

  const subNotebookId = await db.notebooks.add({ title: subNotebookTitle });
  if (!subNotebookId) throw new Error("Could not create sub notebook");

  await db.relations.add(
    { type: "notebook", id: notebookId },
    { type: "notebook", id: subNotebookId }
  );

  await db.notes.addToNotebook(subNotebookId, noteId);

  return { subNotebookId, notebookId };
}

test("add invalid note", () =>
  databaseTest().then(async (db) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(db.notes.add()).rejects.toThrow();

    expect(db.notes.add({})).rejects.toThrow();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(db.notes.add({ hello: "world" })).rejects.toThrow();
  }));

test("add note", () =>
  noteTest().then(async ({ db, id }) => {
    const note = db.notes.note(id);
    expect(note).toBeDefined();
    expect(await note?.content()).toStrictEqual(TEST_NOTE.content.data);
  }));

test("get note content", () =>
  noteTest().then(async ({ db, id }) => {
    const content = await db.notes.note(id)?.content();
    expect(content).toStrictEqual(TEST_NOTE.content.data);
  }));

test("delete note", () =>
  noteTest().then(async ({ db, id }) => {
    const notebookId = await db.notebooks.add(TEST_NOTEBOOK);
    if (!notebookId) throw new Error("Could not create notebook.");

    const subNotebookId = await db.notebooks.add({ title: "hello" });
    if (!notebookId) throw new Error("Could not create sub notebook.");

    await db.relations.add(
      { type: "notebook", id: notebookId },
      { type: "notebook", id: subNotebookId }
    );

    await db.notes.addToNotebook(subNotebookId, id);

    await db.notes.delete(id);

    expect(db.notes.note(id)).toBeUndefined();
    expect(db.notebooks.totalNotes(notebookId)).toBe(0);
    expect(db.notebooks.totalNotes(subNotebookId)).toBe(0);
  }));

test("get all notes", () =>
  noteTest().then(async ({ db }) => {
    expect(db.notes.all.length).toBeGreaterThan(0);
  }));

test("note without a title should get a premade title", () =>
  noteTest().then(async ({ db, id }) => {
    const note = db.notes.note(id);
    expect(note?.title.startsWith("Note ")).toBe(true);
  }));

test("note should get headline from content", () =>
  noteTest({
    ...TEST_NOTE,
    content: {
      type: TEST_NOTE.content.type,
      data: "<p>This is a very colorful existence.</p>"
    }
  }).then(async ({ db, id }) => {
    const note = db.notes.note(id);
    expect(note?.headline).toBe("This is a very colorful existence.");
  }));

test("note should not get headline if there is no p tag", () =>
  noteTest({
    ...TEST_NOTE,
    content: {
      type: TEST_NOTE.content.type,
      data: `<ol style="list-style-type: decimal;" data-mce-style="list-style-type: decimal;"><li>Hello I won't be a headline :(</li><li>Me too.</li><li>Gold.</li></ol>`
    }
  }).then(async ({ db, id }) => {
    const note = db.notes.note(id);
    expect(note?.headline).toBe("");
  }));

test("note title should allow trailing space", () =>
  noteTest({ title: "Hello ", content: TEST_NOTE.content }).then(
    async ({ db, id }) => {
      const note = db.notes.note(id);
      expect(note?.title).toBe("Hello ");
    }
  ));

test("note title should not allow newlines", () =>
  noteTest({ title: "Hello\nhello", content: TEST_NOTE.content }).then(
    async ({ db, id }) => {
      const note = db.notes.note(id);
      expect(note?.title).toBe("Hello hello");
    }
  ));

test("update note", () =>
  noteTest().then(async ({ db, id }) => {
    const noteData = {
      id,
      title: "I am a new title",
      content: {
        type: TEST_NOTE.content.type,
        data: "<p><br/></p>"
      },
      pinned: true,
      favorite: true
      // colors: ["red", "blue"]
    };
    await db.notes.add(noteData);
    const note = db.notes.note(id);
    expect(note?.title).toBe(noteData.title);
    expect(await note?.content()).toStrictEqual(noteData.content.data);
    expect(note?.data.pinned).toBe(true);
    expect(note?.data.favorite).toBe(true);
  }));

test("get favorite notes", () =>
  noteTest({
    ...TEST_NOTE,
    favorite: true
  }).then(({ db }) => {
    expect(db.notes.favorites.length).toBeGreaterThan(0);
  }));

test("get pinned notes", () =>
  noteTest({
    ...TEST_NOTE,
    pinned: true
  }).then(({ db }) => {
    expect(db.notes.pinned.length).toBeGreaterThan(0);
  }));

test("get grouped notes by abc", () => groupedTest("abc"));

test("get grouped notes by month", () => groupedTest("month"));

test("get grouped notes by year", () => groupedTest("year"));

test("get grouped notes by weak", () => groupedTest("week"));

test("get grouped notes default", () => groupedTest("default"));

test("pin note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await note?.pin();
    note = db.notes.note(id);
    expect(note?.data.pinned).toBe(true);
  }));

test("favorite note", () =>
  noteTest().then(async ({ db, id }) => {
    let note = db.notes.note(id);
    await note?.favorite();
    note = db.notes.note(id);
    expect(note?.data.favorite).toBe(true);
  }));

test("add note to subnotebook", () =>
  noteTest().then(async ({ db, id }) => {
    const { subNotebookId, notebookId } = await createAndAddNoteToNotebook(
      db,
      id,
      {
        notebookTitle: "Hello",
        subNotebookTitle: "Home"
      }
    );

    expect(
      db.relations.from({ type: "notebook", id: notebookId }, "notebook")
    ).toHaveLength(1);
    expect(db.notebooks.totalNotes(subNotebookId)).toBe(1);
    expect(db.notebooks.totalNotes(notebookId)).toBe(1);
  }));

test("duplicate note to topic should not be added", () =>
  noteTest().then(async ({ db, id }) => {
    const { subNotebookId } = await createAndAddNoteToNotebook(db, id, {
      notebookTitle: "Hello",
      subNotebookTitle: "Home"
    });
    expect(db.notebooks.totalNotes(subNotebookId)).toBe(1);
  }));

test("add the same note to 2 notebooks", () =>
  noteTest().then(async ({ db, id }) => {
    const nb1 = await createAndAddNoteToNotebook(db, id, {
      notebookTitle: "Hello",
      subNotebookTitle: "Home"
    });
    const nb2 = await createAndAddNoteToNotebook(db, id, {
      notebookTitle: "Hello2",
      subNotebookTitle: "Home2"
    });

    expect(
      db.relations
        .from({ type: "notebook", id: nb1.subNotebookId }, "note")
        .has(id)
    ).toBe(true);
    expect(
      db.relations
        .from({ type: "notebook", id: nb2.subNotebookId }, "note")
        .has(id)
    ).toBe(true);
    expect(db.relations.to({ type: "note", id }, "notebook")).toHaveLength(2);
  }));

test("moving note to same notebook and topic should do nothing", () =>
  noteTest().then(async ({ db, id }) => {
    const { subNotebookId } = await createAndAddNoteToNotebook(db, id, {
      notebookTitle: "Home",
      subNotebookTitle: "Hello"
    });

    await db.notes.addToNotebook(subNotebookId, id);

    expect(db.relations.to({ type: "note", id }, "notebook")).toHaveLength(1);
  }));

test("export note to html", () =>
  noteTest().then(async ({ db, id }) => {
    const html = await db.notes.export(id, { format: "html" });
    if (!html) throw new Error("Failed to export.");
    expect(html.includes(TEST_NOTE.content.data)).toBeTruthy();
  }));

test("export note to md", () =>
  noteTest().then(async ({ db, id }) => {
    const md = await db.notes.export(id, { format: "md" });
    if (!md) throw new Error("Failed to export.");
    expect(md).toBeTypeOf("string");
    expect(md.includes(`Hello This is colorful\n`)).toBeTruthy();
  }));

test("export note to txt", () =>
  noteTest().then(async ({ db, id }) => {
    const txt = await db.notes.export(id, { format: "txt" });
    if (!txt) throw new Error("Failed to export.");

    expect(txt.includes("Hello")).toBeTruthy();
  }));

test("deleting a colored note should remove it from that color", () =>
  noteTest().then(async ({ db, id }) => {
    const colorId = await db.colors.add({
      title: "yellow",
      colorCode: "#ffff22"
    });
    const color = db.colors.color(colorId);
    if (!color) throw new Error("Failed to add color.");

    await db.relations.add(
      { id: colorId, type: "color" },
      { id, type: "note" }
    );

    expect(
      db.relations.from({ id: colorId, type: "color" }, "note").has(id)
    ).toBe(true);

    await db.notes.delete(id);

    expect(
      db.relations.from({ id: colorId, type: "color" }, "note").has(id)
    ).toBe(false);
  }));

test("note's content should follow note's localOnly property", () =>
  noteTest().then(async ({ db, id }) => {
    await db.notes.note(id)?.localOnly();
    let note = db.notes.note(id);
    if (!note?.contentId) throw new Error("No content in note.");

    expect(note?.data.localOnly).toBe(true);
    let content = await db.content.get(note.contentId);
    expect(content?.localOnly).toBe(true);

    await db.notes.note(id)?.localOnly();
    note = db.notes.note(id);
    if (!note?.contentId) throw new Error("No content in note.");

    expect(note?.data.localOnly).toBe(false);
    content = await db.content.get(note.contentId);
    expect(content?.localOnly).toBe(false);
  }));

test("grouping items where item.title is empty or undefined shouldn't throw", () => {
  expect(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    groupArray([{ title: "" }], {
      groupBy: "abc",
      sortBy: "title",
      sortDirection: "asc"
    })
  ).toBeTruthy();
});

test("note content should not contain image base64 data after save", () =>
  noteTest().then(async ({ db, id }) => {
    await loginFakeUser(db);

    await db.notes.add({ id, content: { type: "tiptap", data: IMG_CONTENT } });
    const note = db.notes.note(id);
    const content = await note?.content();

    expect(content).not.toContain(`src="data:image/png;`);
    expect(content).not.toContain(`src=`);
  }));

test("adding a note with an invalid tag should clean the tag array", () =>
  databaseTest().then(async (db) => {
    await expect(
      db.notes.add({
        ...TEST_NOTE,
        id: "helloworld",
        tags: ["    "]
      })
    ).resolves.toBe("helloworld");

    expect(
      db.relations.to({ id: "helloworld", type: "note" }, "tag")
    ).toHaveLength(0);
  }));

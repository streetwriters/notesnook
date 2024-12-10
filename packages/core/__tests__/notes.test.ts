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

import dayjs from "dayjs";
import Database from "../src/api/index.js";
import { createKeySelector, groupArray } from "../src/utils/grouping.js";
import {
  databaseTest,
  noteTest,
  TEST_NOTE,
  TEST_NOTEBOOK,
  IMG_CONTENT,
  loginFakeUser
} from "./utils/index.js";
import { test, expect } from "vitest";
import { GroupOptions, Note } from "../src/types.js";

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
    expect(await db.notes.exists(id)).toBe(true);
  }));

test("get note content", () =>
  noteTest().then(async ({ db, id }) => {
    const note = await db.notes.note(id);
    const content = await db.content.get(note.contentId);
    expect(content?.data).toStrictEqual(TEST_NOTE.content.data);
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

    await db.notes.moveToTrash(id);

    expect(await db.notes.note(id)).toBeUndefined();
    expect(await db.notebooks.totalNotes(notebookId)).toBe(0);
    expect(await db.notebooks.totalNotes(subNotebookId)).toBe(0);
  }));

test("get all notes", () =>
  noteTest().then(async ({ db }) => {
    expect(await db.notes.all.count()).toBeGreaterThan(0);
  }));

test("note without a title should get a premade title", () =>
  noteTest().then(async ({ db, id }) => {
    const note = await db.notes.note(id);
    expect(note?.title.startsWith("Note ")).toBe(true);
  }));

test("setting note title to empty should set the default title", () =>
  noteTest({ title: "I am some title" }).then(async ({ db, id }) => {
    await db.notes.add({ id, title: "" });
    const note = await db.notes.note(id);
    expect(note?.title.startsWith("Note ")).toBe(true);
  }));

test("changing content shouldn't reset the note title ", () =>
  noteTest({ title: "I am a note" }).then(async ({ db, id }) => {
    await db.notes.add({
      id,
      content: {
        type: TEST_NOTE.content.type,
        data: "<p>This is a very colorful existence.</p>"
      }
    });
    const note = await db.notes.note(id);
    expect(note?.title).toBe("I am a note");
  }));

test("note should get headline from content", () =>
  noteTest({
    ...TEST_NOTE,
    content: {
      type: TEST_NOTE.content.type,
      data: "<p>This is a very colorful existence.</p>"
    }
  }).then(async ({ db, id }) => {
    const note = await db.notes.note(id);
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
    const note = await db.notes.note(id);
    expect(note?.headline).toBe("");
  }));

test("note title should allow trailing space", () =>
  noteTest({ title: "Hello ", content: TEST_NOTE.content }).then(
    async ({ db, id }) => {
      const note = await db.notes.note(id);
      expect(note?.title).toBe("Hello ");
    }
  ));

test("note title should not allow newlines", () =>
  noteTest({ title: "Hello\nhello", content: TEST_NOTE.content }).then(
    async ({ db, id }) => {
      const note = await db.notes.note(id);
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
        data: '<p data-block-id="p1"><br/></p>'
      },
      pinned: true,
      favorite: true
      // colors: ["red", "blue"]
    };
    await db.notes.add(noteData);
    const note = await db.notes.note(id);
    const content = await db.content.get(note.contentId);

    expect(note?.title).toBe(noteData.title);
    expect(content.data).toStrictEqual(noteData.content.data);
    expect(note?.pinned).toBe(true);
    expect(note?.favorite).toBe(true);
  }));

test("get note tags", () =>
  noteTest({
    ...TEST_NOTE
  }).then(async ({ db, id }) => {
    const tag = await db.tags.add({ title: "hello" });
    await db.relations.add({ type: "tag", id: tag }, { type: "note", id });
    expect(await db.notes.tags(id)).toEqual([await db.tags.tag(tag)]);
  }));

test("get favorite notes", () =>
  noteTest({
    ...TEST_NOTE,
    favorite: true
  }).then(async ({ db }) => {
    expect(await db.notes.favorites.count()).toBeGreaterThan(0);
  }));

test("get pinned notes", () =>
  noteTest({
    ...TEST_NOTE,
    pinned: true
  }).then(async ({ db }) => {
    expect(await db.notes.pinned.count()).toBeGreaterThan(0);
  }));

test("pin note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.notes.pin(true, id);
    const note = await db.notes.note(id);
    expect(note.pinned).toBe(true);
  }));

test("favorite note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.notes.favorite(true, id);
    const note = await db.notes.note(id);
    expect(note.favorite).toBe(true);
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
      await db.relations
        .from({ type: "notebook", id: notebookId }, "notebook")
        .count()
    ).toBe(1);
    expect(await db.notebooks.totalNotes(subNotebookId)).toBe(1);
    expect(await db.notebooks.totalNotes(notebookId)).toBe(1);
  }));

test("duplicate note to topic should not be added", () =>
  noteTest().then(async ({ db, id }) => {
    const { subNotebookId } = await createAndAddNoteToNotebook(db, id, {
      notebookTitle: "Hello",
      subNotebookTitle: "Home"
    });
    expect(await db.notebooks.totalNotes(subNotebookId)).toBe(1);
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
      await db.relations
        .from({ type: "notebook", id: nb1.subNotebookId }, "note")
        .has(id)
    ).toBe(true);
    expect(
      await db.relations
        .from({ type: "notebook", id: nb2.subNotebookId }, "note")
        .has(id)
    ).toBe(true);
    expect(
      await db.relations.to({ type: "note", id }, "notebook").count()
    ).toBe(2);
  }));

test("moving note to same notebook and topic should do nothing", () =>
  noteTest().then(async ({ db, id }) => {
    const { subNotebookId } = await createAndAddNoteToNotebook(db, id, {
      notebookTitle: "Home",
      subNotebookTitle: "Hello"
    });

    await db.notes.addToNotebook(subNotebookId, id);

    expect(
      await db.relations.to({ type: "note", id }, "notebook").count()
    ).toBe(1);
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
      await db.relations.from({ id: colorId, type: "color" }, "note").has(id)
    ).toBe(true);

    await db.notes.moveToTrash(id);

    expect(
      await db.relations.from({ id: colorId, type: "color" }, "note").has(id)
    ).toBe(false);
  }));

test("note's content should follow note's localOnly property", () =>
  noteTest().then(async ({ db, id }) => {
    await db.notes.localOnly(true, id);
    let note = await db.notes.note(id);

    expect(note.localOnly).toBe(true);
    let content = await db.content.get(note.contentId);
    expect(content?.localOnly).toBe(true);

    await db.notes.localOnly(false, id);
    note = await db.notes.note(id);

    expect(note.localOnly).toBe(false);
    content = await db.content.get(note.contentId);
    expect(content?.localOnly).toBe(false);
  }));

test("grouping items where item.title is empty or undefined shouldn't throw", () => {
  expect(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    groupArray(
      [{ title: "" }],
      createKeySelector({
        groupBy: "abc",
        sortBy: "title",
        sortDirection: "asc"
      })
    )
  ).toBeTruthy();
});

test("note content should not contain image base64 data after save", () =>
  noteTest().then(async ({ db, id }) => {
    await loginFakeUser(db);

    await db.notes.add({ id, content: { type: "tiptap", data: IMG_CONTENT } });
    const note = await db.notes.note(id);
    const content = await db.content.get(note.contentId);

    expect(content.data).not.toContain(`src="data:image/png;`);
    expect(content.data).not.toContain(`src=`);
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
      await db.relations.to({ id: "helloworld", type: "note" }, "tag").count()
    ).toBe(0);
  }));

const groups: { notes: () => Partial<Note>[]; groupOptions: GroupOptions[] }[] =
  [
    {
      notes: () => {
        const alphabet =
          "6789ABCDEFGHIJKLMNOPQRSTUVWMNOPQGHIJKLMNOPQRS0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ/.=-";
        const notes: Partial<Note>[] = [];
        for (let i = 0; i < alphabet.length; ++i) {
          const letter = alphabet[i];
          const letter2 = alphabet[alphabet.length - i];
          notes.push({ title: `${letter}${letter2}` });
        }
        return notes;
      },
      groupOptions: [
        {
          groupBy: "abc",
          sortDirection: "asc",
          sortBy: "title"
        },
        {
          groupBy: "abc",
          sortDirection: "desc",
          sortBy: "title"
        },
        {
          groupBy: "none",
          sortDirection: "asc",
          sortBy: "title"
        },
        {
          groupBy: "none",
          sortDirection: "desc",
          sortBy: "title"
        }
      ]
    },
    {
      notes: () => {
        const notes: Partial<Note>[] = [];
        const now = dayjs(1711420693667);
        const months = [3, 8, 6, 4, 7, 9, 1, 4, 6, 7, 10, 11];
        for (const month of months) {
          const date = now.add(month, "month").valueOf();
          notes.push({
            title: `Note in ${now.add(month, "month").month()} - ${month}`,
            dateCreated: date,
            dateEdited: date
          });
        }
        return notes;
      },
      groupOptions: [
        {
          groupBy: "month",
          sortDirection: "desc",
          sortBy: "dateCreated"
        },
        {
          groupBy: "month",
          sortDirection: "asc",
          sortBy: "dateCreated"
        },
        {
          groupBy: "month",
          sortDirection: "asc",
          sortBy: "dateEdited"
        },
        {
          groupBy: "month",
          sortDirection: "desc",
          sortBy: "dateEdited"
        },
        {
          groupBy: "none",
          sortDirection: "desc",
          sortBy: "dateEdited"
        },
        {
          groupBy: "none",
          sortDirection: "asc",
          sortBy: "dateEdited"
        },
        {
          groupBy: "none",
          sortDirection: "asc",
          sortBy: "dateCreated"
        },
        {
          groupBy: "none",
          sortDirection: "desc",
          sortBy: "dateCreated"
        },
        {
          groupBy: "week",
          sortDirection: "asc",
          sortBy: "dateCreated"
        },
        {
          groupBy: "week",
          sortDirection: "desc",
          sortBy: "dateCreated"
        },
        {
          groupBy: "week",
          sortDirection: "asc",
          sortBy: "dateEdited"
        },
        {
          groupBy: "week",
          sortDirection: "desc",
          sortBy: "dateEdited"
        }
      ]
    },
    {
      notes: () => {
        const notes: Partial<Note>[] = [];
        const now = dayjs(1711420693667);
        const years = [3, 8, 6, 4, 7, 9, 1, 4, 6, 7, 10, 11];
        for (const year of years) {
          const date = now.add(year, "year").valueOf();
          notes.push({
            title: `Note in ${now.add(year, "year").year()} - ${year}`,
            dateCreated: date,
            dateEdited: date
          });
        }
        return notes;
      },
      groupOptions: [
        {
          groupBy: "year",
          sortDirection: "desc",
          sortBy: "dateCreated"
        },
        {
          groupBy: "year",
          sortDirection: "asc",
          sortBy: "dateCreated"
        },
        {
          groupBy: "year",
          sortDirection: "asc",
          sortBy: "dateEdited"
        },
        {
          groupBy: "year",
          sortDirection: "desc",
          sortBy: "dateEdited"
        }
      ]
    },
    {
      notes: () => {
        const notes: Partial<Note>[] = [];
        const ranges = {
          Recent: [0, 7],
          "Last week": [7, 14],
          Older: [14, 28]
        };
        for (const key in ranges) {
          const range = ranges[key];
          for (let i = range[0]; i < range[1]; i++) {
            const date = dayjs().subtract(i, "days").toDate().getTime();

            notes.push({
              title: `Note in ${key} - ${i}`,
              dateCreated: date,
              dateEdited: date
            });
          }
        }

        return notes;
      },
      groupOptions: [
        {
          groupBy: "default",
          sortDirection: "desc",
          sortBy: "dateCreated"
        },
        {
          groupBy: "default",
          sortDirection: "asc",
          sortBy: "dateCreated"
        },
        {
          groupBy: "default",
          sortDirection: "asc",
          sortBy: "dateEdited"
        },
        {
          groupBy: "default",
          sortDirection: "desc",
          sortBy: "dateEdited"
        }
      ]
    }
  ];

for (const group of groups) {
  const notes = group.notes();
  for (const groupOptions of group.groupOptions) {
    const title = `group notes by ${groupOptions.groupBy}, sort by ${groupOptions.sortBy}, direction ${groupOptions.sortDirection}`;
    test(`${title}`, () =>
      databaseTest().then(async (db) => {
        await Promise.all(notes.map((note) => db.notes.add(note)));
        await db.notes.add({ title: `Pinned note`, pinned: true });
        await db.notes.add({
          title: `Conflicted`,
          conflicted: true
        });
        const grouping = await db.notes.all.grouped(groupOptions);
        const items: string[] = [];
        for (let i = 0; i < grouping.length; i++) {
          const item = await grouping.item(i);
          if (item.group) items.push(`GROUP: ${item.group.title}`);
          if (item.item) items.push(item.item.title);
        }
        expect(items).toMatchSnapshot();
      }));
  }
}

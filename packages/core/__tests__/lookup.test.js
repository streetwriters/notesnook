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

import {
  noteTest,
  TEST_NOTE,
  notebookTest,
  TEST_NOTEBOOK2,
  databaseTest
} from "./utils/index.ts";
import { test, expect, describe } from "vitest";

const content = {
  ...TEST_NOTE.content,
  data: "<p>hello i am a note of the world</p>"
};

//TODO
test("search notes", () =>
  noteTest({
    content: content
  }).then(async ({ db }) => {
    await db.notes.add(TEST_NOTE);
    await db.notes.add({
      content: { data: "<p>hb <b>kb</b> ch</p>", type: "tiptap" },
      title: "hello"
    });

    expect(await db.lookup.notes("note of the world").ids()).toHaveLength(1);
    expect(await db.lookup.notes("hb kb ch").ids()).toHaveLength(1);
  }));

test("search notes (remove diacritics)", () =>
  noteTest({
    content: {
      type: "tiptap",
      data: "<p>hello i am à la maison</p>"
    }
  }).then(async ({ db }) => {
    await db.notes.add(TEST_NOTE);
    let filtered = await db.lookup.notes("a la maison").ids();
    expect(filtered).toHaveLength(1);
  }));

test("search notes with a locked note", () =>
  noteTest({
    content: content
  }).then(async ({ db }) => {
    const noteId = await db.notes.add(TEST_NOTE);
    await db.vault.create("password");
    await db.vault.add(noteId);
    expect(await db.lookup.notes("note of the world").ids()).toHaveLength(1);
    expect(await db.lookup.notes("format").ids()).toHaveLength(0);
  }));

test("search notes with an empty note", () =>
  noteTest({
    content: content
  }).then(async ({ db }) => {
    await db.notes.add({
      title: "world is a heavy tune",
      content: { type: "tiptap", data: "<p><br></p>" }
    });
    let filtered = await db.lookup.notes("heavy tune").ids();
    expect(filtered).toHaveLength(1);
  }));

test("search notes with opts.titleOnly should search in titles", () =>
  noteTest({
    content: content
  }).then(async ({ db }) => {
    await db.notes.add({
      title: "hello there",
      content: { type: "tiptap", data: "<p>note of the world<br></p>" }
    });
    let filtered = await db.lookup
      .notes("hello there", undefined, { titleOnly: true })
      .ids();
    expect(filtered).toHaveLength(1);
  }));

test("search notes with opts.titleOnly should not search in descriptions", () =>
  noteTest({
    content: content
  }).then(async ({ db }) => {
    let filtered = await db.lookup
      .notes("note of the world", undefined, {
        titleOnly: true
      })
      .ids();
    expect(filtered).toHaveLength(0);
  }));

test("search notebooks", () =>
  notebookTest().then(async ({ db }) => {
    await db.notebooks.add(TEST_NOTEBOOK2);
    let filtered = await db.lookup.notebooks("Description").ids();
    expect(filtered.length).toBeGreaterThan(0);
  }));

test("search notebook with titleOnly option should search in titles", () =>
  notebookTest().then(async ({ db }) => {
    await db.notebooks.add(TEST_NOTEBOOK2);
    let filtered = await db.lookup
      .notebooks("Notebook", { titleOnly: true })
      .ids();
    expect(filtered.length).toBeGreaterThan(0);
  }));

test("search notebook with titleOnly option should not search in descriptions", () =>
  notebookTest().then(async ({ db }) => {
    await db.notebooks.add(TEST_NOTEBOOK2);
    let filtered = await db.lookup
      .notebooks("Description", { titleOnly: true })
      .ids();
    expect(filtered).toHaveLength(0);
  }));

test("search should not return trashed notes", () =>
  databaseTest().then(async (db) => {
    const id = await db.notes.add({
      title: "world is a heavy tune"
    });
    await db.notes.moveToTrash(id);

    const filtered = await db.lookup.notes("heavy tune").ids();

    expect(filtered).toHaveLength(0);
  }));

test("search should return restored notes", () =>
  databaseTest().then(async (db) => {
    const id = await db.notes.add({
      title: "world is a heavy tune"
    });
    await db.notes.moveToTrash(id);
    await db.trash.restore(id);

    const filtered = await db.lookup.notes("heavy tune").ids();

    expect(filtered).toHaveLength(1);
  }));

test("search reminders", () =>
  databaseTest().then(async (db) => {
    await db.reminders.add({
      title: "remind me",
      description: "please do",
      date: Date.now()
    });

    const titleSearch = await db.lookup.reminders("remind me").ids();
    expect(titleSearch).toHaveLength(1);
    const descriptionSearch = await db.lookup.reminders("please do").ids();
    expect(descriptionSearch).toHaveLength(1);
  }));

test("search reminders with titleOnly option should search in titles", () =>
  databaseTest().then(async (db) => {
    await db.reminders.add({
      title: "remind me very important",
      description: "hmm",
      date: Date.now()
    });

    const filtered = await db.lookup
      .reminders("important", { titleOnly: true })
      .ids();
    expect(filtered).toHaveLength(1);
  }));

test("search reminders with titleOnly option should not search in descriptions", () =>
  databaseTest().then(async (db) => {
    await db.reminders.add({
      title: "remind me",
      description: "idc",
      date: Date.now()
    });

    const filtered = await db.lookup
      .reminders("idc", { titleOnly: true })
      .ids();
    expect(filtered).toHaveLength(0);
  }));

describe("lookup.fuzzy", () => {
  describe("opts.matchOnly", () => {
    test("should return all items when matchOnly is false", () => {
      databaseTest().then((db) => {
        const items = [
          {
            title: "hello"
          },
          {
            title: "world"
          }
        ];
        const successQuery = "o";
        const failureQuery = "i";
        expect(db.lookup.fuzzy(successQuery, items, "title")).toStrictEqual(
          items
        );
        expect(db.lookup.fuzzy(failureQuery, items, "title")).toStrictEqual(
          items
        );
      });
    });
    test("should return only matching items when matchOnly is true", () => {
      databaseTest().then((db) => {
        const items = [
          {
            title: "hello"
          },
          {
            title: "world"
          }
        ];
        const successQuery = "or";
        const failureQuery = "i";
        expect(
          db.lookup.fuzzy(successQuery, items, "title", { matchOnly: true })
        ).toStrictEqual([items[1]]);
        expect(
          db.lookup.fuzzy(failureQuery, items, "title", { matchOnly: true })
        ).toStrictEqual([]);
      });
    });
  });
  describe("opts.prefix", () => {
    test("should prefix matched field with provided value when given", () => {
      databaseTest().then((db) => {
        const items = [
          {
            title: "hello"
          },
          {
            title: "world"
          }
        ];
        const query = "d";
        expect(
          db.lookup.fuzzy(query, items, "title", {
            prefix: "prefix-"
          })
        ).toStrictEqual([items[0], { title: "worlprefix-d" }]);
      });
    });
  });
  describe("opt.suffix", () => {
    test("should suffix matched field with provided value when given", () => {
      databaseTest().then((db) => {
        const items = [
          {
            title: "hello"
          },
          {
            title: "world"
          }
        ];
        const query = "llo";
        expect(
          db.lookup.fuzzy(query, items, "title", {
            suffix: "-suffix"
          })
        ).toStrictEqual([{ title: "hello-suffix" }, items[1]]);
      });
    });
  });
});

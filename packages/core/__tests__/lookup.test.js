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

test("search notes (remove html tags)", () =>
  noteTest({
    content: {
      type: "tiptap",
      data: "<p block-id='1'>hello this is a word</p>"
    }
  }).then(async ({ db }) => {
    await db.notes.add(TEST_NOTE);
    expect(await db.lookup.notes("block").ids()).toHaveLength(0);
    expect(await db.lookup.notes("hello").ids()).toHaveLength(2);
    expect(await db.lookup.notes("word").ids()).toHaveLength(1);
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

test("search notebooks", () =>
  notebookTest().then(async ({ db }) => {
    await db.notebooks.add(TEST_NOTEBOOK2);
    let filtered = await db.lookup.notebooks("Description").ids();
    expect(filtered.length).toBeGreaterThan(0);
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

describe("notesWithHighlighting", () => {
  test("search notes with nbsp in should decode html entities", () =>
    noteTest({
      title: "(with nbsp)",
      content: {
        type: "tiptap",
        data: "<p>hello&nbsp;i&nbsp;am&nbsp;a&nbsp;note</p>"
      }
    }).then(async ({ db }) => {
      const filtered = await db.lookup.notesWithHighlighting(
        "hello",
        db.notes.all
      );
      const item = await filtered.item(0);
      expect(item.item).toBeDefined();
      expect(item.item.content[0][0].suffix.includes("&nbsp;")).toBe(false);
    }));

  test("search notes with parentheses in query should load the item", () =>
    noteTest({
      title: "(with parantheses)"
    }).then(async ({ db }) => {
      await db.notes.add(TEST_NOTE);
      const filtered = await db.lookup.notesWithHighlighting(
        "(with parantheses)",
        db.notes.all
      );
      const item = await filtered.item(0);
      expect(item.item).toBeDefined();
    }));

  test("search notes with brackets in query should load the item", () =>
    noteTest({
      title: "[with brackets]"
    }).then(async ({ db }) => {
      await db.notes.add(TEST_NOTE);
      const filtered = await db.lookup.notesWithHighlighting(
        "[with brackets]",
        db.notes.all
      );
      const item = await filtered.item(0);
      expect(item.item).toBeDefined();
    }));

  test("search should be diacritic agnostic", () =>
    databaseTest().then(async (db) => {
      await db.notes.add({ title: "outdoor café" });
      await db.notes.add({
        title: "today",
        content: { type: "tiptap", data: "<p>I went to café</p>" }
      });
      await db.notes.add({ title: "indoor cafe" });
      await db.notes.add({
        title: "yesterday",
        content: { type: "tiptap", data: "<p>I went to a cafe</p>" }
      });

      const searchWithoutDiacritics = await db.lookup.notesWithHighlighting(
        "cafe",
        db.notes.all
      );
      expect(searchWithoutDiacritics.length).toBe(4);

      const searchWithDiacritics = await db.lookup.notesWithHighlighting(
        "café",
        db.notes.all
      );
      expect(searchWithDiacritics.length).toBe(4);
    }));

  test("should not reuse filters (aka mutate selector) between searches", () =>
    databaseTest().then(async (db) => {
      const note1Id = await db.notes.add({ title: "note 1" });
      const note2Id = await db.notes.add({ title: "note 2" });
      const note3Id = await db.notes.add({ title: "note 3" });
      const tag1Id = await db.tags.add({ title: "daily" });
      const tag2Id = await db.tags.add({ title: "academia" });
      await db.relations.add(
        { id: tag1Id, type: "tag" },
        { id: note1Id, type: "note" }
      );
      await db.relations.add(
        { id: tag2Id, type: "tag" },
        { id: note2Id, type: "note" }
      );

      /**
       * this test ensures that the selector passed to `notesWithHighlighting` is not mutated between searches
       */
      const selector = db.notes.all;

      const tag1SearchResults = await db.lookup.notesWithHighlighting(
        "tag:daily",
        selector
      );
      expect(await tag1SearchResults.ids()).toEqual([note1Id]);
      expect(await selector.ids()).toEqual([note1Id, note2Id, note3Id]);
      const bothTagResults = await db.lookup.notesWithHighlighting(
        "tag:daily tag:academia",
        selector
      );
      expect(await bothTagResults.ids()).toEqual([note1Id, note2Id]);
      expect(await selector.ids()).toEqual([note1Id, note2Id, note3Id]);
    }));
});

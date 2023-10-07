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

import { noteTest, TEST_NOTE, notebookTest, TEST_NOTEBOOK2 } from "./utils";
import { test, expect } from "vitest";

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
    let filtered = await db.lookup.notes("note the world");
    expect(filtered).toHaveLength(1);
  }));

test("search notes with a locked note", () =>
  noteTest({
    content: content
  }).then(async ({ db }) => {
    const noteId = await db.notes.add(TEST_NOTE);
    await db.vault.create("password");
    await db.vault.add(noteId);
    expect(await db.lookup.notes("note the world")).toHaveLength(1);
    expect(await db.lookup.notes("format")).toHaveLength(0);
  }));

test("search notes with an empty note", () =>
  noteTest({
    content: content
  }).then(async ({ db }) => {
    await db.notes.add({
      title: "world is a heavy tune",
      content: { type: "tiptap", data: "<p><br></p>" }
    });
    let filtered = await db.lookup.notes("heavy tune");
    expect(filtered).toHaveLength(1);
  }));

test("search notebooks", () =>
  notebookTest().then(async ({ db }) => {
    await db.notebooks.add(TEST_NOTEBOOK2);
    let filtered = db.lookup.notebooks(
      await db.notebooks.all.items(),
      "Description"
    );
    expect(filtered.length).toBeGreaterThan(0);
  }));

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

import { noteTest, TEST_NOTE } from "./utils";
import { test, expect, describe } from "vitest";

function checkColorValue(note, value) {
  expect(note.data.color).toBe(value);
}

function checkTagValue(note, value) {
  expect(note.data.tags[0]).toBe(value);
}

describe.each([
  ["tag", "untag", "tagged", "hello"],
  ["color", "uncolor", "colored", "red"]
])("%s", (action, unaction, filter, value) => {
  let check = action === "tag" ? checkTagValue : checkColorValue;
  let collection = action === "tag" ? "tags" : "colors";
  // let key = action === "tag" ? "tags" : "color";

  test(`${action} a note`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);
      note = db.notes.note(id);
      check(note, value);
      expect(db[collection].all[0].title).toBe(value);
      expect(db[collection].all[0].noteIds).toHaveLength(1);
    }));

  test(`${action} 2 notes`, () =>
    noteTest().then(async ({ db, id }) => {
      const id2 = await db.notes.add(TEST_NOTE);
      let note = db.notes.note(id);
      await note[action](value);
      note = db.notes.note(id2);
      await note[action](value);
      expect(db[collection].all[0].title).toBe(value);
      expect(db[collection].all[0].noteIds).toHaveLength(2);
    }));

  test(`${unaction} from note`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);
      note = db.notes.note(id);
      check(note, value);
      await note[unaction](value);
      note = db.notes.note(id);
      check(note, undefined);
      expect(db[collection].all).toHaveLength(0);
    }));

  test(`get ${collection}`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);
      expect(db[collection].all.length).toBeGreaterThan(0);
    }));

  test(`get notes in ${action}`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);
      const tag = db[collection].all.find((v) => v.title === value);
      const filteredNotes = db.notes[filter](tag.id);
      check(db.notes.note(filteredNotes[0]), value);
    }));

  test(`rename a ${action}`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);
      let tag = db[collection].tag(value);
      await db[collection].rename(tag.id, value + "    new");
      tag = db[collection].tag(tag.id);
      expect(db[collection].alias(tag.id)).toBe(value + "    new");
    }));

  test(`remove a ${action}`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);

      let tag = db[collection].tag(value);
      await db[collection].remove(tag.id);
      expect(db[collection].tag(value)).toBeUndefined();
    }));

  test(`elements in ${collection}.all contain alias property`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](value);

      expect(db[collection].all.every((item) => !!item.alias)).toBe(true);
    }));

  test(`invalid characters from ${action} title are removed`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      await note[action](`${value.toUpperCase()}      \t\t\t\t\t\r\n\r\n`);
      note = db.notes.note(id);
      check(note, value);
    }));

  test(`accented characters from ${action} title are not removed`, () =>
    noteTest().then(async ({ db, id }) => {
      let note = db.notes.note(id);
      const _value = `échantillo`;
      await note[action](_value);
      note = db.notes.note(id);
      check(note, _value);
    }));
});

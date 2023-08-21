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

import { databaseTest, noteTest, TEST_NOTE } from "./utils";
import { test, expect } from "vitest";

test("create vault", () =>
  databaseTest().then(async (db) => {
    await expect(db.vault.create("password")).resolves.toBe(true);
    const vaultKey = await db.storage().read("vaultKey");
    expect(vaultKey).toBeDefined();
    expect(vaultKey.iv).toBeDefined();
    expect(vaultKey.cipher).toBeDefined();
    expect(vaultKey.length).toBeDefined();
  }));

test("unlock vault", () =>
  databaseTest().then(async (db) => {
    await expect(db.vault.create("password")).resolves.toBe(true);
    await expect(db.vault.unlock("password")).resolves.toBe(true);
  }));

test("unlock non-existent vault", () =>
  databaseTest().then(async (db) => {
    await expect(db.vault.unlock("password")).rejects.toThrow(/ERR_NO_VAULT/);
  }));

test("unlock vault with wrong password", () =>
  databaseTest().then(async (db) => {
    await db.vault.create("password");
    await expect(db.vault.unlock("passwrd")).rejects.toThrow(
      /ERR_WRONG_PASSWORD/
    );
  }));

test("lock a note when no vault has been created", () =>
  noteTest().then(async ({ db, id }) => {
    await expect(db.vault.add(id)).rejects.toThrow(/ERR_NO_VAULT/);
  }));

test("lock a note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const note = db.notes.note(id);

    expect(note.headline).toBe("");

    const content = await db.content.raw(note.data.contentId, false);
    expect(content.noteId).toBeDefined();
    expect(content.data.iv).toBeDefined();
    expect(content.data.cipher).toBeDefined();
  }));

test("locked note is not favorited", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const note = db.notes.note(id);

    expect(note.data.favorite).toBeFalsy();
  }));

test("unlock a note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const note = await db.vault.open(id, "password");
    expect(note.id).toBe(id);
    expect(note.content.data).toBeDefined();
    expect(note.content.type).toBe(TEST_NOTE.content.type);
  }));

test("unlock a note permanently", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    await db.vault.remove(id, "password");
    const note = db.notes.note(id);
    expect(note.id).toBe(id);
    expect(note.headline).not.toBe("");
    const content = await db.content.raw(note.data.contentId);
    expect(content.data).toBeDefined();
    expect(typeof content.data).toBe("string");
  }));

test("save a locked note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    const note = db.notes.note(id).data;
    await db.vault.save(note);

    const content = await db.content.raw(note.contentId);

    expect(content.data.cipher).toBeTypeOf("string");
    expect(() => JSON.parse()).toThrow();
  }));

test("save an edited locked note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    const note = db.notes.note(id).data;
    await db.vault.save({
      ...note,
      content: { type: "tiptap", data: "<p>hello world</p>" }
    });

    const content = await db.content.raw(note.contentId);

    expect(content.data.cipher).toBeTypeOf("string");
    expect(() => JSON.parse(content.data.cipher)).toThrow();
  }));

test("change vault password", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    await expect(db.vault.open(id, "password")).resolves.toBeDefined();

    await db.vault.changePassword("password", "newPassword");

    await expect(db.vault.open(id, "password")).rejects.toThrow();
    await expect(db.vault.open(id, "newPassword")).resolves.toBeDefined();
  }));

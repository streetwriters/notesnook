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

import { VAULT_ERRORS } from "../src/api/vault.ts";
import { databaseTest, delay, noteTest, TEST_NOTE } from "./utils/index.ts";
import { test, expect } from "vitest";

test("create vault", () =>
  databaseTest().then(async (db) => {
    await expect(db.vault.create("password")).resolves.toBe(true);
    const vault = await db.vaults.default();
    expect(vault).toBeDefined();
    expect(vault.key.iv).toBeDefined();
    expect(vault.key.cipher).toBeDefined();
    expect(vault.key.length).toBeDefined();
  }));

test("lock vault", () =>
  databaseTest().then(async (db) => {
    await expect(db.vault.create("password")).resolves.toBe(true);
    expect(db.vault.lock()).resolves.toBe(true);
  }));

test("lock non-existent vault", () =>
  databaseTest().then(async (db) => {
    expect(db.vault.lock()).resolves.toBe(true);
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

    const note = await db.notes.note(id);
    const content = await db.content.get(note.contentId);
    const vault = await db.vaults.default();

    expect(note.headline).toBe("");

    expect(content.noteId).toBeDefined();
    expect(content.data.iv).toBeDefined();
    expect(content.data.cipher).toBeDefined();

    expect(await db.relations.from(vault, "note").has(id)).toBe(true);
  }));

test("locked note is not favorited", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const note = await db.notes.note(id);

    expect(note.favorite).toBeFalsy();
  }));

test("unlock a note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    const note = await db.vault.open(id, "password");

    const vault = await db.vaults.default();
    expect(note.id).toBe(id);
    expect(note.content.data).toBeDefined();
    expect(note.content.type).toBe(TEST_NOTE.content.type);
    expect(await db.relations.from(vault, "note").has(id)).toBe(true);
  }));

test("unlock a note permanently", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    await db.vault.remove(id, "password");

    const note = await db.notes.note(id);
    const content = await db.content.get(note.contentId);
    const vault = await db.vaults.default();

    expect(note.id).toBe(id);
    expect(note.headline).not.toBe("");
    expect(content.data).toBeDefined();
    expect(typeof content.data).toBe("string");
    expect(await db.relations.from(vault, "note").has(id)).toBe(false);
  }));

test("lock an empty note", () =>
  noteTest({ title: "I am a note" }).then(async ({ db, id }) => {
    await db.vault.create("password");

    await db.vault.add(id);

    const note = await db.notes.note(id);
    const content = await db.content.get(note.contentId);
    const vault = await db.vaults.default();
    expect(note.headline).toBe("");
    expect(content.locked).toBeTruthy();
    expect(content.noteId).toBeDefined();
    expect(content.data.iv).toBeDefined();
    expect(content.data.cipher).toBeDefined();
    expect(await db.relations.from(vault, "note").has(id)).toBe(true);
  }));

test("save a locked note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    const note = await db.notes.note(id);
    await db.vault.save(note);

    const content = await db.content.get(note.contentId);

    expect(content.data.cipher).toBeTypeOf("string");
  }));

test("save an edited locked note", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    const note = await db.notes.note(id);
    await db.vault.save({
      ...note,
      content: { type: "tiptap", data: "<p>hello world</p>" }
    });

    const content = await db.content.get(note.contentId);

    expect(content.data.cipher).toBeTypeOf("string");
    expect(() => JSON.parse(content.data.cipher)).toThrow();
    expect(note.dateEdited).toBeLessThan((await db.notes.note(id)).dateEdited);
    expect(note.dateEdited).toBeLessThan(content.dateEdited);
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

test("changing vault password without a vault should throw", () =>
  noteTest().then(async ({ db }) => {
    await expect(
      db.vault.changePassword("password", "newPassword")
    ).rejects.toThrow(VAULT_ERRORS.noVault);
  }));

test("clear vault", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    await db.vault.clear("password");

    const vault = await db.vaults.default();
    expect(await db.relations.from(vault, "note").has(id)).toBe(false);
  }));

test("delete vault without deleting all locked notes", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const vault = await db.vaults.default();

    await db.vault.delete();

    expect(await db.relations.from(vault, "note").has(id)).toBe(false);
    expect(await db.vaults.default()).toBeUndefined();
  }));

test("delete vault and delete all locked notes", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);
    const vault = await db.vaults.default();

    await db.vault.delete(true);

    expect(await db.relations.from(vault, "note").has(id)).toBe(false);
    expect(await db.notes.exists(id)).toBe(false);
    expect(await db.vaults.default()).toBeUndefined();
  }));

test("vault password is cleared after specified time", () =>
  databaseTest().then(async (db) => {
    await expect(db.vault.create("password")).resolves.toBe(true);
    db.vault.eraseTime = 1000;
    await expect(db.vault.unlock("password")).resolves.toBe(true);
    expect(db.vault.unlocked).toBe(true);
    await delay(1500);
    expect(db.vault.unlocked).toBe(false);
  }));

// test("remove note from vault if it isn't encrypted", () =>
//   noteTest().then(async ({ db, id }) => {
//     await db.vault.create("password");
//     const vault = await db.vaults.default();

//     await db.relations.add(vault, { id, type: "note" });

//     const decryptedContent = await db.vault.decryptContent(
//       {
//         data: "<p>hello world</p>",
//         type: "tiptap"
//       },
//       "password"
//     );

//     expect(await db.relations.from(vault, "note").has(id)).toBe(false);
//     expect(decryptedContent.data).toBe("<p>hello world</p>");
//   }));

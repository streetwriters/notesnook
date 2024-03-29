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

import { delay, noteTest, TEST_NOTE } from "./utils";
import { test, expect } from "vitest";

// async function sessionTest(db, noteId) {
//   let note = await db.notes.note(noteId).data;
//   let content = {
//     data: await db.notes.note(noteId).content(),
//     type: "tiptap",
//   };
//   let session = await db.noteHistory.add(noteId, note.dateEdited, content);

//   return session;
// }

test("new history session should be automatically created on note save", () =>
  noteTest({ ...TEST_NOTE, sessionId: Date.now() }).then(async ({ db, id }) => {
    const sessions = await db.noteHistory.get(id);
    expect(sessions).toHaveLength(1);
    await expect(db.noteHistory.content(sessions[0].id)).resolves.toMatchObject(
      TEST_NOTE.content
    );
  }));

test("editing the same note should create multiple history sessions", () =>
  noteTest({ ...TEST_NOTE, sessionId: Date.now() }).then(async ({ db, id }) => {
    let editedContent = {
      data: TEST_NOTE.content.data + "<p>Some new content</p>",
      type: "tiptap"
    };

    await db.notes.add({
      id: id,
      content: editedContent,
      sessionId: Date.now() + 10000
    });

    const sessions = await db.noteHistory.get(id);
    expect(sessions).toHaveLength(2);

    await expect(db.noteHistory.content(sessions[0].id)).resolves.toMatchObject(
      editedContent
    );
    await expect(db.noteHistory.content(sessions[1].id)).resolves.toMatchObject(
      TEST_NOTE.content
    );
  }));

test("restoring an old session should replace note's content", () =>
  noteTest({ ...TEST_NOTE, sessionId: Date.now() }).then(async ({ db, id }) => {
    let editedContent = {
      data: TEST_NOTE.content.data + "<p>Some new content</p>",
      type: "tiptap"
    };

    await db.notes.add({
      id: id,
      content: editedContent,
      sessionId: Date.now() + 10000
    });

    const [, firstVersion] = await db.noteHistory.get(id);
    await db.noteHistory.restore(firstVersion.id);

    await expect(db.notes.note(id).content()).resolves.toBe(
      TEST_NOTE.content.data
    );
  }));

test("date created of session should not change on edit", () =>
  noteTest({ ...TEST_NOTE, sessionId: "session" }).then(async ({ db, id }) => {
    const [{ dateCreated, dateModified }] = await db.noteHistory.get(id);

    let editedContent = {
      data: TEST_NOTE.content.data + "<p>Some new content</p>",
      type: "tiptap"
    };

    await delay(1000);

    await db.notes.add({
      id: id,
      content: editedContent,
      sessionId: "session"
    });

    const [{ dateCreated: newDateCreated, dateModified: newDateModified }] =
      await db.noteHistory.get(id);
    expect(newDateCreated).toBe(dateCreated);
    expect(newDateModified).toBeGreaterThan(dateModified);
  }));

test("serialized session data should get deserialized", () =>
  noteTest({ ...TEST_NOTE, sessionId: "session" }).then(async ({ db, id }) => {
    let json = await db.noteHistory.serialize();

    await db.noteHistory.clearSessions(id);
    await db.noteHistory.deserialize(json);

    let history = await db.noteHistory.get(id);
    expect(history).toHaveLength(1);

    let content = await db.noteHistory.content(history[0].id);
    expect(content).toMatchObject(TEST_NOTE.content);
  }));

test("clear a note's sessions", () =>
  noteTest({ ...TEST_NOTE, sessionId: "session" }).then(async ({ db, id }) => {
    await db.noteHistory.clearSessions(id);

    let history = await db.noteHistory.get(id);
    expect(history).toHaveLength(0);
  }));

test("remove a single session by sessionId", () =>
  noteTest({ ...TEST_NOTE, sessionId: "iamasession" }).then(
    async ({ db, id }) => {
      const [{ id: sessionId }] = await db.noteHistory.get(id);

      await db.noteHistory.remove(sessionId);
      let history = await db.noteHistory.get(sessionId);
      expect(history).toHaveLength(0);
    }
  ));

test("return empty array if no history available", () =>
  noteTest().then(async ({ db, id }) => {
    let history = await db.noteHistory.get(id);
    expect(history).toHaveLength(0);
  }));

test("session should not be added to history if values are null or undefined", () =>
  noteTest().then(async ({ db }) => {
    let history = await db.noteHistory.add();
    expect(history).toBeUndefined();
  }));

test("auto clear sessions if they exceed the limit", () =>
  noteTest({ ...TEST_NOTE, sessionId: Date.now() }).then(async ({ db, id }) => {
    let editedContent = {
      data: TEST_NOTE.content.data + "<p>Some new content</p>",
      type: "tiptap"
    };

    await db.notes.add({
      id: id,
      content: editedContent,
      sessionId: Date.now() + 10000
    });

    let sessions = await db.noteHistory.get(id);
    expect(sessions).toHaveLength(2);

    await db.noteHistory._cleanup(id, 1);

    sessions = await db.noteHistory.get(id);
    expect(await db.noteHistory.get(id)).toHaveLength(1);

    const content = await db.noteHistory.content(sessions[0].id);
    expect(content.data).toBe(editedContent.data);
  }));

test("save a locked note should add a locked session to note history", () =>
  noteTest().then(async ({ db, id }) => {
    await db.vault.create("password");
    await db.vault.add(id);

    const note = db.notes.note(id).data;
    const editedContent = { type: "tiptap", data: "<p>hello world</p>" };
    await db.vault.save({
      ...note,
      content: editedContent,
      sessionId: "lockedsession"
    });

    const sessions = await db.noteHistory.get(id);
    expect(sessions).toHaveLength(1);

    const lockedContent = await db.noteHistory.content(sessions[0].id);
    const unlockedContent = await db.vault.decryptContent(
      lockedContent,
      "password"
    );
    expect(unlockedContent).toMatchObject(editedContent);
  }));

test("locking an old note should clear its history", () =>
  noteTest({ ...TEST_NOTE, sessionId: "notesession" }).then(
    async ({ db, id }) => {
      await db.vault.create("password");
      await db.vault.add(id);

      const sessions = await db.noteHistory.get(id);
      expect(sessions).toHaveLength(0);
    }
  ));

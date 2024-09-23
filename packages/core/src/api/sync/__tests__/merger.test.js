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
  TEST_NOTE,
  databaseTest,
  loginFakeUser
} from "../../../../__tests__/utils/index.ts";
import { expect, describe, vi } from "vitest";
import Merger from "../merger.ts";

describe.concurrent("merge item synchronously", (test) => {
  test("accept remote item if no local item is found", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const merger = new Merger(db);

      const merged = merger.mergeItem(
        {
          type: "color"
        },
        undefined
      );

      expect(merged).toBeDefined();
      expect(merged.type).toBe("color");
    }));

  test("accept remote item if it is newer than local item", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const merger = new Merger(db);

      const merged = merger.mergeItem(
        {
          type: "color",
          dateModified: Date.now()
        },
        {
          type: "color",
          dateModified: Date.now() - 1000
        }
      );

      expect(merged).toBeDefined();
      expect(merged.type).toBe("color");
    }));

  test("accept local item if it is newer than remote item", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const merger = new Merger(db);

      const merged = merger.mergeItem(
        {
          type: "color",
          dateModified: Date.now() - 1000
        },
        {
          type: "color",
          dateModified: Date.now()
        }
      );

      expect(merged).toBeUndefined();
    }));
});

describe.concurrent("merge content", (test) => {
  test("do nothing if local item is localOnly", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const merger = new Merger(db);

      const merged = await merger.mergeContent(
        {
          type: "tiptap",
          data: "Hello"
        },
        {
          type: "tiptap",
          localOnly: true
        }
      );

      expect(merged).toBeUndefined();
    }));

  test("accept remote item if local item is not defined", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const merger = new Merger(db);

      const merged = await merger.mergeContent(
        {
          type: "tiptap"
        },
        undefined
      );

      expect(merged).toBeDefined();
      expect(merged.type).toBe("tiptap");
    }));

  test("accept remote item if it is newer than local item", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const merger = new Merger(db);

      const merged = merger.mergeContent(
        {
          type: "tiptap",
          data: "Remote",
          dateEdited: Date.now()
        },
        {
          type: "tiptap",
          data: "Local",
          synced: true,
          dateEdited: Date.now() - 1000
        }
      );

      expect(merged).toBeDefined();
      expect(merged.data).toBe("Remote");
    }));

  test("trigger conflict if local item is unsynced", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const merger = new Merger(db);

      const noteId = await db.notes.add(TEST_NOTE);
      const merged = merger.mergeContent(
        {
          type: "tiptap",
          data: "Remote",
          noteId,
          dateEdited: Date.now() - 60000
        },
        {
          type: "tiptap",
          data: "Local",
          noteId,
          synced: false,
          dateEdited: Date.now()
        }
      );

      expect(merged).toBeDefined();
      expect(merged.data).toBe("Local");
      expect(merged.conflicted).toBeDefined();
      expect(merged.conflicted.data).toBe("Remote");
    }));

  test("merge conflicts if local item is already conflicted", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const merger = new Merger(db);

      const noteId = await db.notes.add({ ...TEST_NOTE, conflicted: true });
      const merged = await merger.mergeContent(
        {
          type: "tiptap",
          data: "Conflicted remote 2",
          noteId
        },
        {
          type: "tiptap",
          data: "Local",
          noteId,
          conflicted: { type: "tiptap", data: "Conflicted remote" }
        }
      );

      expect(merged).toBeDefined();
      expect(merged.data).toBe("Local");
      expect(merged.conflicted).toBeDefined();
      expect(merged.conflicted.data).toBe("Conflicted remote 2");
      expect(await db.notes.conflicted.has(noteId)).toBe(true);
    }));

  describe("auto resolve conflict", () => {
    describe("edits under the conflict threshold", (test) => {
      test("keep remote if it is newer", () =>
        databaseTest().then(async (db) => {
          await loginFakeUser(db);
          const merger = new Merger(db);

          const noteId = await db.notes.add(TEST_NOTE);
          const merged = await merger.mergeContent(
            {
              type: "tiptap",
              data: "Remote",
              noteId,
              dateEdited: Date.now() - 3000,
              dateModified: Date.now()
            },
            {
              type: "tiptap",
              data: "Local",
              noteId,
              dateEdited: Date.now(),
              dateModified: Date.now() - 6000
            }
          );

          expect(merged).toBeDefined();
          expect(merged.data).toBe("Remote");
        }));

      test("keep local if it is newer", () =>
        databaseTest().then(async (db) => {
          await loginFakeUser(db);
          const merger = new Merger(db);

          const noteId = await db.notes.add(TEST_NOTE);
          const merged = await merger.mergeContent(
            {
              type: "tiptap",
              data: "Remote",
              noteId,
              dateEdited: Date.now() - 3000,
              dateModified: Date.now() - 6000
            },
            {
              type: "tiptap",
              data: "Local",
              noteId,
              dateEdited: Date.now(),
              dateModified: Date.now()
            }
          );

          expect(merged).toBeUndefined();
        }));
    });

    describe("edits are equal", (test) => {
      test("keep remote if it is newer", () =>
        databaseTest().then(async (db) => {
          await loginFakeUser(db);
          const merger = new Merger(db);

          const noteId = await db.notes.add(TEST_NOTE);
          const merged = await merger.mergeContent(
            {
              type: "tiptap",
              data: "Remote",
              noteId,
              dateEdited: Date.now() - 60000,
              dateModified: Date.now()
            },
            {
              type: "tiptap",
              data: "Remote",
              noteId,
              dateEdited: Date.now(),
              dateModified: Date.now() - 6000
            }
          );

          expect(merged).toBeDefined();
          expect(merged.data).toBe("Remote");
        }));

      test("keep local if it is newer", () =>
        databaseTest().then(async (db) => {
          await loginFakeUser(db);
          const merger = new Merger(db);

          const noteId = await db.notes.add(TEST_NOTE);
          const merged = await merger.mergeContent(
            {
              type: "tiptap",
              data: "Remote",
              noteId,
              dateEdited: Date.now() - 60000,
              dateModified: Date.now() - 6000
            },
            {
              type: "tiptap",
              data: "Remote",
              noteId,
              dateEdited: Date.now(),
              dateModified: Date.now()
            }
          );

          expect(merged).toBeUndefined();
        }));
    });
  });
});

describe.concurrent("merge attachment", () => {
  describe("accept remote item", (test) => {
    const cases = [
      {
        name: "local item is undefined",
        remote: { type: "attachment" },
        local: undefined
      },
      {
        name: "local item is deleted (remote is newer)",
        remote: { type: "attachment", dateModified: Date.now() },
        local: {
          type: "attachment",
          deleted: true,
          dateModified: Date.now() - 1000
        }
      },
      {
        name: "remote item is deleted (remote is newer)",
        remote: { type: "attachment", deleted: true, dateModified: Date.now() },
        local: { type: "attachment", dateModified: Date.now() - 1000 }
      },
      {
        name: "remote item's dateUploaded is more recent",
        remote: {
          type: "attachment",
          dateUploaded: Date.now()
        },
        local: { type: "attachment", dateUploaded: Date.now() - 1000 }
      }
    ];

    for (const testCase of cases) {
      test(testCase.name, () =>
        databaseTest().then(async (db) => {
          await loginFakeUser(db);
          const merger = new Merger(db);
          db.attachments.remove = vi.fn(() => true);

          const merged = await merger.mergeAttachment(
            testCase.remote,
            testCase.local
          );

          expect(merged).toBeDefined();
          expect(merged).toStrictEqual(testCase.remote);
        })
      );
    }
  });

  describe("accept local item", (test) => {
    const cases = [
      {
        name: "local item is deleted (local is newer)",
        remote: { type: "attachment", dateModified: Date.now() - 1000 },
        local: {
          type: "attachment",
          deleted: true,
          dateModified: Date.now()
        }
      },
      {
        name: "remote item is deleted (local is newer)",
        remote: {
          type: "attachment",
          deleted: true,
          dateModified: Date.now() - 1000
        },
        local: { type: "attachment", dateModified: Date.now() }
      },
      {
        name: "local item's dateUploaded is more recent",
        remote: {
          type: "attachment",
          dateUploaded: Date.now() - 1000
        },
        local: { type: "attachment", dateUploaded: Date.now() }
      }
    ];

    for (const testCase of cases) {
      test(testCase.name, () =>
        databaseTest().then(async (db) => {
          await loginFakeUser(db);
          const merger = new Merger(db);

          const merged = await merger.mergeAttachment(
            testCase.remote,
            testCase.local
          );

          expect(merged).toBeUndefined();
        })
      );
    }
  });
});

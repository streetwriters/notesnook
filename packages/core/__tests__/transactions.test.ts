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

import { describe, expect, test, vi } from "vitest";
import { sql } from "@streetwriters/kysely";
import { databaseTest, loginFakeUser } from "./utils/index.ts";
import { EVENTS } from "../src/common.ts";
import { isScopeable } from "../src/database/scope.ts";
import { Tiptap } from "../src/content-types/tiptap.ts";
import { NoteHistory } from "../src/collections/note-history.ts";

type TestDB = Awaited<ReturnType<typeof databaseTest>>;

const activeIds = async (db: TestDB, table: "notes" | "relations" | "tags") =>
  (
    await db
      .sql()
      .selectFrom(table)
      .where((eb) => eb.or([eb("deleted", "is", null), eb("deleted", "==", 0)]))
      .select("id")
      .execute()
  ).map((r) => r.id);

const link = (db: TestDB, noteId: string, tagId = "t1") =>
  db.relations.add({ type: "note", id: noteId }, { type: "tag", id: tagId });

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};

describe("db.transaction", () => {
  test("commits everything written through tx", () =>
    databaseTest().then(async (db) => {
      await db.transaction(async (tx) => {
        await link(tx, "n1");
        await link(tx, "n2");
      });
      expect(await activeIds(db, "relations")).toHaveLength(2);
    }));

  test("rolls back everything if the executor throws", () =>
    databaseTest().then(async (db) => {
      await expect(
        db.transaction(async (tx) => {
          await link(tx, "n1");
          await link(tx, "n2");
          throw new Error("boom");
        })
      ).rejects.toThrow("boom");
      expect(await activeIds(db, "relations")).toHaveLength(0);
    }));

  test("returns the executor's result", () =>
    databaseTest().then(async (db) => {
      expect(await db.transaction(async () => 42)).toBe(42);
    }));

  test("tx has its own copies of the collections but shares their state", () =>
    databaseTest().then(async (db) => {
      await db.transaction(async (tx) => {
        expect(tx).not.toBe(db);
        expect(tx.notes).not.toBe(db.notes);
        expect(tx.sql()).not.toBe(db.sql);
        expect(tx.notes.cache).toBe(db.notes.cache);
        expect(tx.trash.cache).toBe(db.trash.cache);
      });
    }));
});

describe("scoping", () => {
  test("every member created with the database is re-bound to tx", () =>
    databaseTest().then(async (db) => {
      const bound = Object.keys(db).filter((key) =>
        isScopeable((db as any)[key], db)
      );
      // sanity check: this is not accidentally empty
      expect(bound).toEqual(
        expect.arrayContaining(["notes", "content", "relations", "settings"])
      );

      await db.transaction(async (tx) => {
        for (const key of bound) {
          const original = (db as any)[key];
          const scoped = (tx as any)[key];
          expect(scoped, key).not.toBe(original);
          expect(Object.getPrototypeOf(scoped), key).toBe(original);
          if (original.db) expect(scoped.db, key).toBe(tx);
          if (original.collection)
            expect(scoped.collection, key).not.toBe(original.collection);
        }
      });
    }));

  test("assigning to a field of a scoped copy assigns it on the original", () =>
    databaseTest().then(async (db) => {
      const archived = db.notes.cache.archived;
      await db.transaction(async (tx) => {
        (tx.notes as any).someField = 1;
        expect((db.notes as any).someField).toBe(1);
        (tx.notes as any).cache = { ...db.notes.cache, archived: ["x"] };
        expect(db.notes.cache.archived).toEqual(["x"]);
        // re-bound fields stay on the copy
        expect(tx.notes.collection).not.toBe(db.notes.collection);
      });
      db.notes.cache.archived = archived;
    }));

  test("scoped caches are shared with the original", () =>
    databaseTest().then(async (db) => {
      await db.transaction(async (tx) => {
        expect((tx.settings as any).collection.cache).toBe(
          (db.settings as any).collection.cache
        );
      });
    }));

  test("a member added to the database later is scoped without being listed anywhere", () =>
    databaseTest().then(async (db) => {
      const later = { db, name: "later" };
      (db as any).later = later;
      await db.transaction(async (tx) => {
        expect((tx as any).later).not.toBe(later);
        expect((tx as any).later.db).toBe(tx);
        expect((tx as any).later.name).toBe("later");
      });
    }));

  test("collections nested inside a scoped member are re-bound too", () =>
    databaseTest().then(async (db) => {
      await db.transaction(async (tx) => {
        expect(tx.noteHistory.sessionContent.db).toBe(tx);
        expect(tx.noteHistory.sessionContent).not.toBe(
          db.noteHistory.sessionContent
        );
      });
    }));
});

describe("isolation from unrelated callers", () => {
  test("an unrelated write made during a transaction survives its rollback", () =>
    databaseTest().then(async (db) => {
      const release = deferred();
      const started = deferred();

      const failing = db.transaction(async (tx) => {
        await link(tx, "n1");
        started.resolve();
        await release.promise;
        throw new Error("boom");
      });
      await started.promise;

      // unrelated code uses the root database; it waits for the transaction
      const unrelated = db.notes.add({ title: "unrelated" });
      await new Promise((r) => setTimeout(r, 20));
      release.resolve();

      await expect(failing).rejects.toThrow("boom");
      await unrelated;
      expect(await activeIds(db, "relations")).toHaveLength(0);
      expect(await activeIds(db, "notes")).toHaveLength(1);
    }));

  test("transactions started together run one after the other", () =>
    databaseTest().then(async (db) => {
      const order: string[] = [];
      await Promise.all([
        db.transaction(async (tx) => {
          order.push("a:start");
          await link(tx, "n1");
          await new Promise((r) => setTimeout(r, 20));
          order.push("a:end");
        }),
        db.transaction(async (tx) => {
          order.push("b:start");
          await link(tx, "n2");
          order.push("b:end");
        })
      ]);
      expect(order).toEqual(["a:start", "a:end", "b:start", "b:end"]);
      expect(await activeIds(db, "relations")).toHaveLength(2);
    }));

  test("using the root database inside a transaction throws instead of deadlocking", () =>
    databaseTest().then(async (db) => {
      await expect(
        db.transaction(async () => {
          await db.sql().selectFrom("notes").selectAll().execute();
        })
      ).rejects.toThrow(/Use the `tx`/);
      await expect(
        db.transaction(async () => {
          await db.transaction(async () => {});
        })
      ).rejects.toThrow(/Use the `tx`/);
    }));
});

describe("nested transactions", () => {
  test("a nested transaction commits with its parent", () =>
    databaseTest().then(async (db) => {
      await db.transaction(async (tx) => {
        await link(tx, "n1");
        await tx.transaction(async (nested) => {
          await link(nested, "n2");
        });
      });
      expect(await activeIds(db, "relations")).toHaveLength(2);
    }));

  test("an error the parent rethrows rolls back both", () =>
    databaseTest().then(async (db) => {
      await expect(
        db.transaction(async (tx) => {
          await link(tx, "n1");
          await tx.transaction(async (nested) => {
            await link(nested, "n2");
            throw new Error("boom");
          });
        })
      ).rejects.toThrow("boom");
      expect(await activeIds(db, "relations")).toHaveLength(0);
    }));

  test("a nested transaction joins its parent", () =>
    databaseTest().then(async (db) => {
      await db.transaction(async (tx) => {
        await tx.transaction(async (nested) => {
          expect(nested).toBe(tx);
        });
      });
    }));

  test("an error the parent catches doesn't undo the nested writes", () =>
    databaseTest().then(async (db) => {
      await db.transaction(async (tx) => {
        await link(tx, "n1");
        await tx
          .transaction(async (nested) => {
            await link(nested, "n2");
            throw new Error("boom");
          })
          .catch(() => undefined);
      });
      expect(await activeIds(db, "relations")).toHaveLength(2);
    }));
});

describe("side effects are held back until commit", () => {
  test("afterCommit only exists on the transaction's database", () =>
    databaseTest().then(async (db) => {
      expect((db as any).afterCommit).toBeUndefined();
      await db.transaction(async (tx) => {
        expect(typeof tx.afterCommit).toBe("function");
      });
    }));

  test("afterCommit runs after the commit, in order, and never after a rollback", () =>
    databaseTest().then(async (db) => {
      const calls: string[] = [];
      await db.transaction(async (tx) => {
        tx.afterCommit(() => calls.push("a"));
        await tx.transaction(async (nested) => {
          nested.afterCommit(() => calls.push("nested"));
        });
        tx.afterCommit(() => calls.push("b"));
        expect(calls).toEqual([]);
      });
      expect(calls).toEqual(["a", "nested", "b"]);

      const dropped = vi.fn();
      await db
        .transaction(async (tx) => {
          tx.afterCommit(dropped);
          throw new Error("boom");
        })
        .catch(() => undefined);
      expect(dropped).not.toHaveBeenCalled();
    }));

  test("events are only published after the commit", () =>
    databaseTest().then(async (db) => {
      const handler = vi.fn();
      db.eventManager.subscribe(EVENTS.databaseUpdated, handler);

      await db.transaction(async (tx) => {
        await link(tx, "n1");
        expect(handler).not.toHaveBeenCalled();
      });
      expect(handler).toHaveBeenCalled();
    }));

  test("no events are published for a rolled back transaction", () =>
    databaseTest().then(async (db) => {
      const handler = vi.fn();
      db.eventManager.subscribe(EVENTS.databaseUpdated, handler);

      await db
        .transaction(async (tx) => {
          await link(tx, "n1");
          throw new Error("boom");
        })
        .catch(() => undefined);
      expect(handler).not.toHaveBeenCalled();
    }));
});

describe("collections", () => {
  test("tags.remove is atomic", () =>
    databaseTest().then(async (db) => {
      const tagId = await db.tags.add({ title: "tag" });
      await link(db, "n1", tagId);

      const softDelete = vi
        .spyOn(db.tags.collection, "softDelete")
        .mockRejectedValueOnce(new Error("disk full"));
      await expect(db.tags.remove(tagId)).rejects.toThrow("disk full");
      softDelete.mockRestore();

      // the relation must not have been unlinked
      expect(await activeIds(db, "relations")).toHaveLength(1);
      expect(await activeIds(db, "tags")).toHaveLength(1);

      await db.tags.remove(tagId);
      expect(await activeIds(db, "relations")).toHaveLength(0);
      expect(await activeIds(db, "tags")).toHaveLength(0);
    }));

  test("notes.remove is atomic", () =>
    databaseTest().then(async (db) => {
      const id = await db.notes.add({
        title: "note",
        content: { type: "tiptap", data: "<p>hello</p>" }
      });
      await link(db, id);

      const del = vi
        .spyOn(db.inboxItemsHistory, "delete")
        .mockRejectedValueOnce(new Error("disk full"));
      await expect(db.notes.remove(id)).rejects.toThrow("disk full");
      del.mockRestore();

      expect(await activeIds(db, "notes")).toEqual([id]);
      expect(await activeIds(db, "relations")).toHaveLength(1);
      expect(await db.content.findByNoteId(id)).toBeDefined();

      await db.notes.remove(id);
      expect(await activeIds(db, "notes")).toHaveLength(0);
    }));

  test("a failing collection write inside notes.add leaves no orphan content", () =>
    databaseTest().then(async (db) => {
      const upsert = vi
        .spyOn(db.notes.collection, "upsert")
        .mockRejectedValueOnce(new Error("disk full"));

      await expect(
        db.notes.add({
          title: "a",
          content: { type: "tiptap", data: "<p>a</p>" }
        })
      ).rejects.toThrow("disk full");
      upsert.mockRestore();

      expect(await activeIds(db, "notes")).toHaveLength(0);
      expect(
        await db.sql().selectFrom("content").select("id").execute()
      ).toHaveLength(0);
    }));

  test("the $count$ title token counts the notes in the database", () =>
    databaseTest().then(async (db) => {
      db.settings.setTitleFormat("Note $count$");
      const first = await db.notes.add({
        content: { type: "tiptap", data: "<p>a</p>" }
      });
      const second = await db.notes.add({
        content: { type: "tiptap", data: "<p>b</p>" }
      });
      expect((await db.notes.note(first))?.title).toBe("Note 1");
      expect((await db.notes.note(second))?.title).toBe("Note 2");

      // trashed and rolled back notes don't count
      await db.notes.moveToTrash(second);
      await db
        .transaction(async (tx) => {
          await tx.notes.add({ content: { type: "tiptap", data: "<p>c</p>" } });
          throw new Error("boom");
        })
        .catch(() => undefined);
      const third = await db.notes.add({
        content: { type: "tiptap", data: "<p>d</p>" }
      });
      expect((await db.notes.note(third))?.title).toBe("Note 2");

      // archived notes don't count either
      await db.notes.archive(true, third);
      const fourth = await db.notes.add({
        content: { type: "tiptap", data: "<p>e</p>" }
      });
      expect((await db.notes.note(fourth))?.title).toBe("Note 2");
    }));

  test("archive updates the archived cache only once committed", () =>
    databaseTest().then(async (db) => {
      const id = await db.notes.add({ title: "note" });

      await db
        .transaction(async (tx) => {
          await tx.notes.archive(true, id);
          // not applied while the transaction is open
          expect(db.notes.cache.archived).not.toContain(id);
          throw new Error("boom");
        })
        .catch(() => undefined);
      expect(db.notes.cache.archived).not.toContain(id);
      expect((await db.notes.collection.get(id))?.archived).toBeFalsy();

      await db.notes.archive(true, id);
      expect(db.notes.cache.archived).toContain(id);
      await db.notes.archive(false, id);
      expect(db.notes.cache.archived).not.toContain(id);
    }));

  test("trash and restore keep the trash cache in sync with committed state", () =>
    databaseTest().then(async (db) => {
      const id = await db.notes.add({ title: "note" });

      await db
        .transaction(async (tx) => {
          await tx.notes.remove(id);
          throw new Error("boom");
        })
        .catch(() => undefined);
      expect(db.trash.cache.notes).not.toContain(id);

      await db.notes.moveToTrash(id);
      expect(db.trash.cache.notes).toContain(id);

      await db.trash.restore(id);
      expect(db.trash.cache.notes).not.toContain(id);
      expect((await db.notes.collection.get(id))?.type).toBe("note");
    }));

  test("trash.clear is atomic and resets the caches only once committed", () =>
    databaseTest().then(async (db) => {
      const id = await db.notes.add({
        title: "note",
        content: { type: "tiptap", data: "<p>hello</p>" }
      });
      await db.notes.moveToTrash(id);

      const remove = vi
        .spyOn(db.notes, "remove")
        .mockRejectedValueOnce(new Error("disk full"));
      await expect(db.trash.clear()).rejects.toThrow("disk full");
      remove.mockRestore();
      expect(db.trash.cache.notes).toContain(id);
      expect(await db.content.findByNoteId(id)).toBeDefined();

      await db.trash.clear();
      expect(db.trash.cache.notes).toHaveLength(0);
    }));

  test("notebooks.moveToTrash rolls back and keeps the trash cache untouched", () =>
    databaseTest().then(async (db) => {
      const parent = await db.notebooks.add({ title: "parent" });
      const child = await db.notebooks.add({ title: "child" });
      await db.relations.add(
        { type: "notebook", id: parent },
        { type: "notebook", id: child }
      );

      // trashing the sub notebooks works, trashing the parent fails
      const original = db.trash.add;
      const add = vi
        .spyOn(db.trash, "add")
        .mockImplementationOnce(function (this: typeof db.trash, ...args) {
          return original.apply(this, args);
        })
        .mockRejectedValueOnce(new Error("boom"));
      await expect(db.notebooks.moveToTrash(parent)).rejects.toThrow("boom");
      add.mockRestore();

      expect(db.trash.cache.notebooks).toHaveLength(0);
      for (const id of [parent, child])
        expect((await db.notebooks.collection.get(id))?.type).toBe("notebook");

      await db.notebooks.moveToTrash(parent);
      expect(db.trash.cache.notebooks).toContain(parent);
    }));
});

describe("kv & config", () => {
  test("kv and config writes inside a transaction commit and roll back with it", () =>
    databaseTest().then(async (db) => {
      await db.transaction(async (tx) => {
        await tx.kv().write("deviceId", "committed");
      });
      expect(await db.kv().read("deviceId")).toBe("committed");

      await db
        .transaction(async (tx) => {
          await tx.kv().write("deviceId", "rolled back");
          await tx.config().setItem("key", "rolled back");
          throw new Error("boom");
        })
        .catch(() => undefined);
      expect(await db.kv().read("deviceId")).toBe("committed");
      expect(await db.config().getItem("key")).toBeUndefined();
    }));

  test("using the root kv or config inside a transaction throws instead of hanging", () =>
    databaseTest().then(async (db) => {
      await expect(
        db.transaction(async () => {
          await db.kv().read("user");
        })
      ).rejects.toThrow(/Use the `tx`/);
      await expect(
        db.transaction(async () => {
          await db.config().getItem("key");
        })
      ).rejects.toThrow(/Use the `tx`/);
    }));

  test("the user's keys can be read inside a transaction", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const key = await db.transaction(async (tx) =>
        tx.user.getAttachmentsKey()
      );
      expect(key).toBeDefined();
      expect(await db.user.getAttachmentsKey()).toEqual(key);
    }));
});

describe("notes.add", () => {
  const png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEEAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  test("does the slow work before it opens the transaction", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);

      // db.sql() & db.kv() throw if they are called inside a transaction
      const original = db.attachments.save;
      const save = vi
        .spyOn(db.attachments, "save")
        .mockImplementation(function (this: typeof db.attachments, ...args) {
          db.sql();
          db.kv();
          return original.apply(this, args);
        });
      db.options.maxNoteVersions = async () => {
        db.sql();
        return 100;
      };

      const id = await db.notes.add({
        title: "with an image",
        sessionId: `${Date.now()}`,
        content: {
          type: "tiptap",
          data: `<p>hello</p><img src="data:image/png;base64,${png}" />`
        }
      });
      expect(save).toHaveBeenCalledOnce();

      const content = await db.content.findByNoteId(id);
      expect(content?.data).toContain("data-hash");
      expect(content?.data).not.toContain("base64");
      expect(await db.attachments.ofNote(id, "all").count()).toBe(1);
      expect(await db.noteHistory.get(id).count()).toBeGreaterThan(0);
    }));

  test("parses the content once and saves each new attachment once", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const postProcess = vi.spyOn(Tiptap.prototype, "postProcess");
      const save = vi.spyOn(db.attachments, "save");

      const id = await db.notes.add({
        title: "note",
        content: {
          type: "tiptap",
          data: `<p>hello</p><img src="data:image/png;base64,${png}" />`
        }
      });
      expect(postProcess).toHaveBeenCalledOnce();
      expect(save).toHaveBeenCalledOnce();
      expect(await db.attachments.ofNote(id, "all").count()).toBe(1);
      postProcess.mockRestore();
    }));

  test("parses content without attachments once and still relates its links", () =>
    databaseTest().then(async (db) => {
      const other = await db.notes.add({ title: "other" });
      const postProcess = vi.spyOn(Tiptap.prototype, "postProcess");

      const id = await db.notes.add({
        title: "note",
        content: {
          type: "tiptap",
          data: `<p><a href="nn://note/${other}">link</a></p>`
        }
      });
      expect(postProcess).toHaveBeenCalledOnce();
      expect(
        (await db.relations.from({ type: "note", id }, "note").get()).length
      ).toBe(1);
      postProcess.mockRestore();
    }));

  test("add is prepare followed by addPrepared", () =>
    databaseTest().then(async (db) => {
      const noteId = await db.notes.add({ title: "note" });
      const prepared = await db.content.prepare({
        noteId,
        type: "tiptap",
        data: "<p>prepared</p>"
      });
      // preparing doesn't write anything
      expect(await db.content.findByNoteId(noteId)).toBeUndefined();

      const id = await db.transaction((tx) => tx.content.addPrepared(prepared));
      expect((await db.content.get(id!))?.data).toContain("prepared");

      await expect(
        db.content.prepare({ noteId, remote: true } as any)
      ).rejects.toThrow("db.content.merge");
    }));

  test("trimming the history is atomic", () =>
    databaseTest().then(async (db) => {
      db.options.maxNoteVersions = async () => 100;
      const id = await db.notes.add({
        title: "note",
        sessionId: "1",
        content: { type: "tiptap", data: "<p>one</p>" }
      });
      for (const session of ["2", "3"])
        await db.notes.add({
          id,
          sessionId: session,
          content: { type: "tiptap", data: `<p>${session}</p>` }
        });
      const sessionContent = () =>
        db.sql().selectFrom("sessioncontent").select("id").execute();
      expect(await db.noteHistory.get(id).count()).toBe(3);
      expect(await sessionContent()).toHaveLength(3);

      // the session contents are removed first, then removing the sessions fails
      db.options.maxNoteVersions = async () => 1;
      await sql`CREATE TRIGGER fail_delete BEFORE DELETE ON notehistory
        BEGIN SELECT RAISE(ABORT, 'disk full'); END`.execute(db.sql());
      await expect(db.noteHistory.cleanup()).rejects.toThrow("disk full");
      expect(await db.noteHistory.get(id).count()).toBe(3);
      expect(await sessionContent()).toHaveLength(3);

      await sql`DROP TRIGGER fail_delete`.execute(db.sql());
      await db.noteHistory.cleanup();
      expect(await db.noteHistory.get(id).count()).toBe(1);
      expect(await sessionContent()).toHaveLength(1);
    }));

  test("a failing add leaves no note, content or relation behind", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const upsert = vi
        .spyOn(db.notes.collection, "upsert")
        .mockRejectedValueOnce(new Error("disk full"));

      await expect(
        db.notes.add({
          title: "with an image",
          content: {
            type: "tiptap",
            data: `<p>hello</p><img src="data:image/png;base64,${png}" />`
          }
        })
      ).rejects.toThrow("disk full");
      upsert.mockRestore();

      expect(await activeIds(db, "notes")).toHaveLength(0);
      expect(
        await db.sql().selectFrom("content").select("id").execute()
      ).toHaveLength(0);
      expect(await activeIds(db, "relations")).toHaveLength(0);
    }));

  test("content without a note id is not post-processed", () =>
    databaseTest().then(async (db) => {
      await loginFakeUser(db);
      const save = vi.spyOn(db.attachments, "save");
      const data = `<p>hello</p><img src="data:image/png;base64,${png}" />`;

      const prepared = await db.content.prepare({ type: "tiptap", data });
      expect(save).not.toHaveBeenCalled();
      expect(prepared.content.data).toBe(data);
    }));
});

describe("parallel writes", () => {
  test("writes started together on one tx all commit", () =>
    databaseTest().then(async (db) => {
      await db.transaction(async (tx) => {
        const results = await Promise.allSettled([
          tx.notes.add({ title: "a" }),
          tx.notes.add({ title: "b" }),
          tx.notes.add({ title: "c" })
        ]);
        expect(results.map((r) => r.status)).toEqual([
          "fulfilled",
          "fulfilled",
          "fulfilled"
        ]);
      });
      expect(await activeIds(db, "notes")).toHaveLength(3);
    }));

});

describe("note history cleanup", () => {
  const addSessions = async (db: TestDB, count: number, id?: string) => {
    let noteId = id;
    for (let i = 0; i < count; ++i)
      noteId = await db.notes.add({
        id: noteId,
        title: noteId ? undefined : "note",
        sessionId: `${i}`,
        content: { type: "tiptap", data: `<p>${i}</p>` }
      });
    return noteId!;
  };

  test("saving a note doesn't trim the history", () =>
    databaseTest().then(async (db) => {
      db.options.maxNoteVersions = async () => 1;
      const id = await addSessions(db, 4);
      expect(await db.noteHistory.get(id).count()).toBe(4);
    }));

  test("is started when the user is fetched, outside of any transaction", () =>
    databaseTest().then(async (db) => {
      db.options.maxNoteVersions = async () => 100;
      const first = await addSessions(db, 25);
      const second = await addSessions(db, 3);

      db.options.maxNoteVersions = async () => {
        // db.sql() throws inside a transaction
        db.sql();
        return 2;
      };
      // (init already ran it once, as there is no user)
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000);
      try {
        db.eventManager.publish(EVENTS.userFetched, {});
        await db.noteHistory.cleanupInBackground();
      } finally {
        vi.useRealTimers();
      }

      // more than a batch of sessions are removed, from every note
      expect(await db.noteHistory.get(first).count()).toBe(2);
      expect(await db.noteHistory.get(second).count()).toBe(2);
      expect(
        await db.sql().selectFrom("sessioncontent").select("id").execute()
      ).toHaveLength(4);
    }));

  test("runs at most once an hour", () =>
    databaseTest().then(async (db) => {
      db.options.maxNoteVersions = async () => 100;
      const id = await addSessions(db, 3);
      db.options.maxNoteVersions = async () => 1;

      // databaseTest's init already ran it once (there is no user)
      await db.noteHistory.cleanupInBackground();
      expect(await db.noteHistory.get(id).count()).toBe(3);

      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000);
      try {
        await db.noteHistory.cleanupInBackground();
      } finally {
        vi.useRealTimers();
      }
      expect(await db.noteHistory.get(id).count()).toBe(1);
    }));

  test("never runs twice at the same time", () =>
    databaseTest().then(async (db) => {
      const cleanup = vi
        .spyOn(db.noteHistory, "cleanup")
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 20))
        );
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000);
      try {
        const first = db.noteHistory.cleanupInBackground();
        const second = db.noteHistory.cleanupInBackground();
        expect(second).toBe(first);
        await first;
      } finally {
        vi.useRealTimers();
      }
      expect(cleanup).toHaveBeenCalledOnce();
    }));

  test("is started on init when there is no user", () => {
    const start = vi.spyOn(NoteHistory.prototype, "cleanupInBackground");
    return databaseTest().then(() => {
      expect(start).toHaveBeenCalled();
      start.mockRestore();
    });
  });
});

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


import { expect, test, vi } from "vitest";
import { databaseTest, loginFakeUser } from "./utils";

test("sync should register connection onclose handler only once", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const sync = db.syncer.sync;
    sync.init = vi.fn().mockRejectedValue(new Error("stop"));
    sync.checkConnection = vi.fn();

    await sync.start({ type: "full" }).catch(() => {});
    await sync.start({ type: "full" }).catch(() => {});

    expect((sync.connection as any)._closedCallbacks).toHaveLength(1);
  }));

test("processChunk should not load all records for an empty chunk", () =>
  databaseTest().then(async (db) => {
    const records = vi.spyOn(db.notes.collection, "records");

    await db.syncer.sync.processChunk(
      { type: "note", items: [], count: 0 },
      [],
      { type: "full" }
    );

    expect(records).not.toHaveBeenCalled();
  }));

test("processChunk should log items with an unknown key version", () =>
  databaseTest().then(async (db) => {
    const error = vi.spyOn(db.syncer.sync.logger, "error");

    await db.syncer.sync.processChunk(
      {
        type: "note",
        items: [{ id: "abc", v: 6, keyVersion: 1 } as any],
        count: 1
      },
      [],
      { type: "full" }
    );

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("No key found for key version 1")
      }),
      undefined,
      { ids: ["abc"] }
    );
  }));

test("send syncs should not retry failed attachment uploads", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);
    const hash = await db.attachments.save(
      "iVBORw0KGgoAAAANSUhEUgAAAAEEAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "image/png",
      "test.png"
    );
    const attachment = await db.attachments.attachment(hash!);
    await db.attachments.markAsFailed(attachment!.id, "upload failed");

    const queueUploads = vi
      .spyOn(db.fs(), "queueUploads")
      .mockResolvedValue(undefined as any);
    vi.spyOn(db, "fs").mockReturnValue({ queueUploads } as any);

    await db.syncer.sync.uploadAttachments(true);
    expect(queueUploads).toHaveBeenLastCalledWith([], "sync-uploads");

    await db.syncer.sync.uploadAttachments(false);
    expect(queueUploads.mock.lastCall?.[0]).toHaveLength(1);

    await db.attachments.reset(attachment!.id);
    expect((await db.attachments.attachment(hash!))?.failed).toBeNull();
  }));

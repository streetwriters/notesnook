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

import { expect, test } from "vitest";
import { databaseTest, loginFakeUser } from "./utils";

test("remove orphaned attachments should remove only orphaned attachments", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const hash1 = await db.attachments.save(
      "iVBORw0KGgoAAAANSUhEUgAAAAEEAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "image/png",
      "test.png"
    );
    if (!hash1) throw new Error("Failed to create attachment");
    const noteId = await db.notes.add({
      title: "Test Note"
    });
    const attachments = await db.attachments.all
      .fields(["attachments.id"])
      .where((eb) => eb("hash", "in", [hash1]))
      .items();
    await db.relations.add(
      {
        id: noteId,
        type: "note"
      },
      { id: attachments[0].id, type: "attachment" }
    );

    const hash = await db.attachments.save(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "image/png",
      "test.png"
    );
    if (!hash) throw new Error("Failed to create attachment");

    await db.attachments.removeOrphaned();

    expect(await db.attachments.exists(hash)).toBe(false);
    expect(await db.attachments.exists(hash1)).toBe(true);
    expect(await db.attachments.orphaned.count()).toBe(0);
  }));

test("attachment failure tracking and backoff logic", () =>
  databaseTest().then(async (db) => {
    await loginFakeUser(db);

    const hash = await db.attachments.save(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "image/png",
      "test.png"
    );
    if (!hash) throw new Error("Failed to create attachment");

    const attachment = await db.attachments.attachment(hash);
    if (!attachment) throw new Error("Attachment not found");

    // 1. Fresh attachment is ready for upload
    expect(db.attachments.isReadyForUpload(attachment)).toBe(true);
    expect(db.attachments.getFailure(attachment)).toBeUndefined();
    expect(db.attachments.getFailureReason(attachment)).toBeUndefined();

    // 2. Record first failure (transient network error)
    const fail1 = await db.attachments.recordUploadFailure(
      attachment.id,
      new Error("Network timeout")
    );
    expect(fail1.attempts).toBe(1);
    expect(fail1.reason).toBe("Network timeout");
    expect(fail1.terminal).toBe(false);
    expect(fail1.nextRetryAt).toBeDefined();
    expect(fail1.nextRetryAt!).toBeGreaterThan(Date.now());

    // In cooldown, isReadyForUpload is false
    const attAfterFail1 = await db.attachments.attachment(attachment.id);
    expect(db.attachments.isReadyForUpload(attAfterFail1!)).toBe(false);
    expect(db.attachments.getFailureReason(attAfterFail1!)).toBe(
      "Network timeout"
    );

    // 3. Mark as uploaded clears failure
    await db.attachments.markAsUploaded(attachment.id);
    const attUploaded = await db.attachments.attachment(attachment.id);
    expect(attUploaded?.failed).toBeNull();
    expect(attUploaded?.dateUploaded).toBeDefined();
    expect(db.attachments.isReadyForUpload(attUploaded!)).toBe(false);

    // Reset uploaded to test terminal failure
    await db.attachments.reset(attachment.id);
    const attReset = await db.attachments.attachment(attachment.id);
    expect(db.attachments.isReadyForUpload(attReset!)).toBe(true);

    // 4. Record terminal failure (e.g. 403 Forbidden)
    const failTerminal = await db.attachments.recordUploadFailure(
      attachment.id,
      new Error("403 Forbidden: Invalid bucket permission")
    );
    expect(failTerminal.terminal).toBe(true);
    expect(failTerminal.attempts).toBe(5);
    expect(failTerminal.nextRetryAt).toBeUndefined();

    const attTerminal = await db.attachments.attachment(attachment.id);
    expect(db.attachments.isReadyForUpload(attTerminal!)).toBe(false);

    // 5. User manual retry / markAsFailed clears failure
    await db.attachments.markAsFailed(attachment.id);
    const attRetried = await db.attachments.attachment(attachment.id);
    expect(attRetried?.failed).toBeNull();
    expect(db.attachments.isReadyForUpload(attRetried!)).toBe(true);

    // 7. Manual retry failure does not count towards attempts
    await db.attachments.markAsFailed(attachment.id);
    const failManual = await db.attachments.recordUploadFailure(
      attachment.id,
      new Error("Failed to fetch"),
      true // isManual
    );
    expect(failManual.attempts).toBe(0);
    expect(failManual.terminal).toBe(false);
    expect(failManual.nextRetryAt).toBeUndefined();
    expect(failManual.reason).toBe("Failed to fetch");

    const attManual = await db.attachments.attachment(attachment.id);
    expect(db.attachments.isReadyForUpload(attManual!)).toBe(true);
    expect(db.attachments.getFailureReason(attManual!)).toBe("Failed to fetch");
  }));


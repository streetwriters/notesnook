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

import { CHECK_IDS, EV, EVENTS } from "../src/common.ts";
import { test, expect, vitest } from "vitest";
import { login } from "./utils.js";
import { databaseTest } from "../__tests__/utils/index.ts";

const TEST_TIMEOUT = 60 * 1000;

test(
  "case 1: device A & B should only download the changes from device C (no uploading)",
  async (t) => {
    const types = [];
    function onSyncProgress({ type }) {
      types.push(type);
    }

    const [deviceA, deviceB, deviceC] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB"),
      initializeDevice("deviceC")
    ]);

    t.onTestFinished(async () => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB, deviceC);
    });

    deviceA.eventManager.subscribe(EVENTS.syncProgress, onSyncProgress);
    deviceB.eventManager.subscribe(EVENTS.syncProgress, onSyncProgress);

    await deviceC.notes.add({ title: "new note 1" });

    await deviceC.sync({ type: "full" });
    await deviceA.sync({ type: "full" });
    await deviceB.sync({ type: "full" });

    expect(types.every((t) => t === "download")).toBe(true);
  },
  TEST_TIMEOUT
);

test(
  "case 3: Device A & B have unsynced changes but server has nothing",
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async (r) => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    const note1Id = await deviceA.notes.add({
      title: "Test note from device A"
    });
    const note2Id = await deviceB.notes.add({
      title: "Test note from device B"
    });

    await syncAndWait(deviceA, deviceB);
    await deviceA.sync({ type: "fetch" });

    console.log(note2Id, note1Id);
    expect(await deviceA.notes.note(note2Id)).toBeTruthy();
    expect(await deviceB.notes.note(note1Id)).toBeTruthy();
    expect(await deviceA.notes.note(note1Id)).toBeTruthy();
    expect(await deviceB.notes.note(note2Id)).toBeTruthy();
  },
  TEST_TIMEOUT
);

test(
  "edge case 1: items updated while push is running",
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async () => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    const id = await deviceA.notes.add({ title: "hello" });
    for (let i = 0; i < 5; ++i) {
      if (i > 0) await deviceA.notes.add({ id, title: `edit ${i - 1}` });
      await Promise.all([
        deviceA.sync({ type: "send" }),
        new Promise((resolve) => setTimeout(resolve, 40)).then(() =>
          deviceA.notes.add({ id, title: `edit ${i}` })
        )
      ]);

      expect((await deviceA.notes.note(id))?.title).toBe(`edit ${i}`);
      expect((await deviceA.notes.note(id))?.synced).toBe(true);
      await deviceB.sync({ type: "fetch" });
      expect((await deviceB.notes.note(id))?.title).toBe(`edit ${i}`);
    }
  },
  TEST_TIMEOUT * 10
);

test(
  "edge case 2: new items added while push is running",
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async () => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    const id = await deviceA.notes.add({ title: "hello" });
    for (let i = 0; i < 5; ++i) {
      if (i > 0) await deviceA.notes.add({ id, title: `edit ${i - 1}` });
      await Promise.all([
        deviceA.sync({ type: "send" }),
        new Promise((resolve) => setTimeout(resolve, 40)).then(() =>
          deviceA.notes.add({ title: `note ${i}` })
        )
      ]);
      await deviceB.sync({ type: "fetch" });
      expect(await deviceB.notes.all.count()).toBe(i + 2);
    }
  },
  TEST_TIMEOUT * 10
);

test(
  "issue: syncing should not affect the items' dateModified",
  async (t) => {
    const [deviceA] = await Promise.all([initializeDevice("deviceA")]);

    t.onTestFinished(async (r) => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA);
    });

    const noteId = await deviceA.notes.add({
      title: "Test note from device A",
      content: { data: "<p>Hello</p>", type: "tiptap" }
    });
    const noteDateBefore = (await deviceA.notes.note(noteId)).dateModified;
    const contentDateBefore = (await deviceA.content.findByNoteId(noteId))
      .dateModified;
    await deviceA.sync({ type: "full" });
    const noteDateAfter = (await deviceA.notes.note(noteId)).dateModified;
    const contentDateAfter = (await deviceA.content.findByNoteId(noteId))
      .dateModified;
    expect(noteDateBefore).toBe(noteDateAfter);
    expect(contentDateBefore).toBe(contentDateAfter);
  },
  TEST_TIMEOUT
);

test(
  "case 4: local content changed after remote content should create a conflict",
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async (r) => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    const noteId = await deviceA.notes.add({
      title: "Test note from device A",
      content: { data: "<p>Hello</p>", type: "tiptap" }
    });
    await deviceA.sync({ type: "full" });
    await deviceB.sync({ type: "full" });

    await deviceB.notes.add({
      id: noteId,
      content: { data: "<p>Hello (I am from device B)</p>", type: "tiptap" }
    });
    await deviceB.sync({ type: "full" });

    await new Promise((resolve) => setTimeout(resolve, 10000));

    await deviceA.notes.add({
      id: noteId,
      content: { data: "<p>Hello (I am from device A)</p>", type: "tiptap" }
    });
    await deviceA.sync({ type: "full" });

    expect(await deviceA.notes.conflicted.count()).toBeGreaterThan(0);
  },
  TEST_TIMEOUT * 10
);

test(
  "case 5: remote content changed after local content should create a conflict",
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async (r) => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    const noteId = await deviceA.notes.add({
      title: "Test note from device A",
      content: { data: "<p>Hello</p>", type: "tiptap" }
    });
    await deviceA.sync({ type: "full" });
    await deviceB.sync({ type: "full" });

    await deviceA.notes.add({
      id: noteId,
      content: { data: "<p>Hello (I am from device B)</p>", type: "tiptap" }
    });
    await deviceA.sync({ type: "full" });

    await new Promise((resolve) => setTimeout(resolve, 10000));

    await deviceB.notes.add({
      id: noteId,
      content: { data: "<p>Hello (I am from device A)</p>", type: "tiptap" }
    });
    await deviceB.sync({ type: "full" });

    expect(await deviceB.notes.conflicted.count()).toBeGreaterThan(0);
  },
  TEST_TIMEOUT * 10
);

// test(
//   "case 4: Device A's sync is interrupted halfway and Device B makes some changes afterwards and syncs.",
//   async () => {
//     const deviceA = await initializeDevice("deviceA");
//     const deviceB = await initializeDevice("deviceB");

//     const unsyncedNoteIds = [];
//     for (let i = 0; i < 10; ++i) {
//       const id = await deviceA.notes.add({
//         title: `Test note ${i} from device A`,
//       });
//       unsyncedNoteIds.push(id);
//     }

//     const half = unsyncedNoteIds.length / 2 + 1;
//     deviceA.eventManager.subscribe(
//       EVENTS.syncProgress,
//       async ({ type, current }) => {
//         if (type === "upload" && current === half) {
//           await deviceA.syncer.stop();
//         }
//       }
//     );

//     await expect(deviceA.sync(true)).rejects.toThrow();

//     let syncedNoteIds = [];
//     for (let i = 0; i < unsyncedNoteIds.length; ++i) {
//       const expectedNoteId = unsyncedNoteIds[i];
//       if (deviceB.notes.note(expectedNoteId))
//         syncedNoteIds.push(expectedNoteId);
//     }
//     expect(
//       syncedNoteIds.length === half - 1 || syncedNoteIds.length === half
//     ).toBe(true);

//     const deviceBNoteId = await deviceB.notes.add({
//       title: "Test note of case 4 from device B",
//     });

//     await deviceB.sync(true);

//     await syncAndWait(deviceA, deviceB);

//     expect(deviceA.notes.note(deviceBNoteId)).toBeTruthy();
//     expect(
//       unsyncedNoteIds
//         .map((id) => !!deviceB.notes.note(id))
//         .every((res) => res === true)
//     ).toBe(true);

//     await cleanup(deviceA, deviceB);
//   },
//
// );

// test.only(
//   "case 5: Device A's sync is interrupted halfway and Device B makes changes on the same note's content that didn't get synced on Device A due to interruption.",
//   async () => {
//     const deviceA = await initializeDevice("deviceA");
//     const deviceB = await initializeDevice("deviceB");

//     const noteIds = [];
//     for (let i = 0; i < 10; ++i) {
//       const id = await deviceA.notes.add({
//         content: {
//           type: "tiptap",
//           data: `<p>deviceA=true</p>`,
//         },
//       });
//       noteIds.push(id);
//     }

//     await deviceA.sync(true);
//     await deviceB.sync(true);

//     const unsyncedNoteIds = [];
//     for (let id of noteIds) {
//       const noteId = await deviceA.notes.add({
//         id,
//         content: {
//           type: "tiptap",
//           data: `<p>deviceA=true+changed=true</p>`,
//         },
//       });
//       unsyncedNoteIds.push(noteId);
//     }

//     deviceA.eventManager.subscribe(
//       EVENTS.syncProgress,
//       async ({ type, total, current }) => {
//         const half = total / 2 + 1;
//         if (type === "upload" && current === half) {
//           await deviceA.syncer.stop();
//         }
//       }
//     );

//     await expect(deviceA.sync(true)).rejects.toThrow();

//     await delay(10 * 1000);

//     for (let id of unsyncedNoteIds) {
//       await deviceB.notes.add({
//         id,
//         content: {
//           type: "tiptap",
//           data: "<p>changes from device B</p>",
//         },
//       });
//     }

//     const error = await withError(async () => {
//       await deviceB.sync(true);
//       await deviceA.sync(true);
//     });

//     expect(error).not.toBeInstanceOf(NoErrorThrownError);
//     expect(error.message.includes("Merge")).toBeTruthy();

//     await cleanup(deviceA, deviceB);
//   },
//
// );

test(
  "issue: running force sync from device A makes device B always download everything",
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async () => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    for (let i = 0; i < 3; ++i) {
      await deviceA.notes.add({
        content: {
          type: "tiptap",
          data: `<p>deviceA=true</p>`
        }
      });
    }

    await syncAndWait(deviceA, deviceB, true);

    const handler = vitest.fn();
    deviceB.eventManager.subscribe(EVENTS.syncProgress, handler);

    await deviceB.sync({ type: "full" });

    expect(handler).not.toHaveBeenCalled();
  },
  TEST_TIMEOUT
);

test(
  "issue: colors are not properly created if multiple notes are synced together",
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA", [CHECK_IDS.noteColor]),
      initializeDevice("deviceB", [CHECK_IDS.noteColor])
    ]);

    t.onTestFinished(async () => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    const noteIds = [];
    for (let i = 0; i < 3; ++i) {
      const id = await deviceA.notes.add({
        content: {
          type: "tiptap",
          data: `<p>deviceA=true</p>`
        }
      });
      noteIds.push(id);
    }

    await syncAndWait(deviceA, deviceB);

    const colorId = await deviceA.colors.add({
      title: "yellow",
      colorCode: "#ffff22"
    });
    for (let noteId of noteIds) {
      expect(await deviceB.notes.note(noteId)).toBeTruthy();
      expect(
        await deviceB.relations
          .from({ id: colorId, type: "color" }, "note")
          .has(noteId)
      ).toBe(false);

      await deviceA.relations.add(
        { id: colorId, type: "color" },
        { id: noteId, type: "note" }
      );
    }

    await syncAndWait(deviceA, deviceB);

    expect(await deviceB.colors.exists(colorId)).toBeTruthy();
    const purpleNotes = await deviceB.relations
      .from({ id: colorId, type: "color" }, "note")
      .resolve();
    expect(
      noteIds.every((id) => purpleNotes.findIndex((p) => p.id === id) > -1)
    ).toBe(true);
  },
  TEST_TIMEOUT
);

/**
 *
 * @param {string} id
 * @returns {Promise<Database>}
 */
async function initializeDevice(id, capabilities = []) {
  // initialize(new NodeStorageInterface(), false);

  console.time(`Init ${id}`);
  EV.subscribe(EVENTS.userCheckStatus, async (type) => {
    return {
      type,
      result: capabilities.indexOf(type) > -1
    };
  });
  EV.subscribe(EVENTS.syncCheckStatus, async (type) => {
    return {
      type,
      result: true
    };
  });

  const device = await databaseTest("memory");

  await login(device);

  await device.user.resetUser(false);

  await device.sync({ type: "full" });

  console.timeEnd(`Init ${id}`);
  return device;
}

/**
 *
 * @param  {...Database} devices
 */
async function cleanup(...devices) {
  for (const device of devices) {
    device.disconnectSSE();
    await device.syncer.stop();
    await device.user.logout();
    device.eventManager.unsubscribeAll();
  }
  EV.unsubscribeAll();
}

/**
 *
 * @param {Database} deviceA
 * @param {Database} deviceB
 * @returns
 */
function syncAndWait(deviceA, deviceB, force = false) {
  return new Promise((resolve, reject) => {
    const ref2 = deviceB.eventManager.subscribe(
      EVENTS.databaseSyncRequested,
      (full, force) => {
        if (!full) return;
        console.log("sync requested by device A", full, force);
        ref2.unsubscribe();
        deviceB
          .sync({
            type: full ? "full" : "send",
            force
          })
          .then(resolve)
          .catch(reject);
      }
    );

    console.log(
      "waiting for sync...",
      "Device A:",
      deviceA.syncer.sync.syncing,
      "Device B:",
      deviceB.syncer.sync.syncing
    );

    deviceA.sync({ type: "full", force }).catch(reject);
  });
}

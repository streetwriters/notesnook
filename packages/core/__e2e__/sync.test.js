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

import Database from "../src/api/index";
import { NodeStorageInterface } from "../__mocks__/node-storage.mock";
import { FS } from "../__mocks__/fs.mock";
import Compressor from "../__mocks__/compressor.mock";
import { CHECK_IDS, EV, EVENTS } from "../src/common";
import { EventSource } from "event-source-polyfill";
import { delay } from "../__tests__/utils";
import { test, expect, vitest } from "vitest";
import { login } from "./utils";

const TEST_TIMEOUT = 60 * 1000;

test(
  "case 1: device A & B should only download the changes from device C (no uploading)",
  async () => {
    const types = [];
    function onSyncProgress({ type }) {
      types.push(type);
    }

    const [deviceA, deviceB, deviceC] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB"),
      initializeDevice("deviceC")
    ]);

    deviceA.eventManager.subscribe(EVENTS.syncProgress, onSyncProgress);
    deviceB.eventManager.subscribe(EVENTS.syncProgress, onSyncProgress);

    await deviceC.notes.add({ title: "new note 1" });
    await syncAndWait(deviceC, deviceC);

    expect(types.every((t) => t === "download")).toBe(true);

    console.log("Case 1 log out");
    await cleanup(deviceA, deviceB, deviceC);
  },
  TEST_TIMEOUT
);

test(
  "case 3: Device A & B have unsynced changes but server has nothing",
  async () => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    const note1Id = await deviceA.notes.add({
      title: "Test note from device A"
    });
    const note2Id = await deviceB.notes.add({
      title: "Test note from device B"
    });

    await syncAndWait(deviceA, deviceB);

    expect(deviceA.notes.note(note2Id)).toBeTruthy();
    expect(deviceB.notes.note(note1Id)).toBeTruthy();
    expect(deviceA.notes.note(note1Id)).toBeTruthy();
    expect(deviceB.notes.note(note2Id)).toBeTruthy();

    console.log("Case 3 log out");
    await cleanup(deviceA, deviceB);
  },
  TEST_TIMEOUT
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
  async () => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    await syncAndWait(deviceA, deviceB, true);

    const handler = vitest.fn();
    deviceB.eventManager.subscribe(EVENTS.syncProgress, handler);

    await deviceB.sync(true);

    expect(handler).not.toHaveBeenCalled();

    console.log("issue force sync log out");
    await cleanup(deviceA, deviceB);
  },
  TEST_TIMEOUT
);

test(
  "issue: colors are not properly created if multiple notes are synced together",
  async () => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA", [CHECK_IDS.noteColor]),
      initializeDevice("deviceB", [CHECK_IDS.noteColor])
    ]);

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

    for (let noteId of noteIds) {
      await deviceA.notes.note(noteId).color("purple");
      expect(deviceB.notes.note(noteId)).toBeTruthy();
      expect(deviceB.notes.note(noteId).data.color).toBeUndefined();
    }

    await syncAndWait(deviceA, deviceB);

    const purpleColor = deviceB.colors.tag("purple");
    expect(noteIds.every((id) => purpleColor.noteIds.indexOf(id) > -1)).toBe(
      true
    );

    console.log("issue colors log out");
    await cleanup(deviceA, deviceB);
  },
  TEST_TIMEOUT
);

test(
  "issue: new topic on device A gets replaced by the new topic on device B",
  async () => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);
    // const deviceA = await initializeDevice("deviceA");
    // const deviceB = await initializeDevice("deviceB");

    const id = await deviceA.notebooks.add({ title: "Notebook 1" });

    await syncAndWait(deviceA, deviceB, false);

    expect(deviceB.notebooks.notebook(id)).toBeDefined();

    await deviceA.notebooks.notebook(id).topics.add("Topic 1");
    // to create a conflict
    await delay(1500);
    await deviceB.notebooks.notebook(id).topics.add("Topic 2");

    expect(deviceA.notebooks.notebook(id).topics.has("Topic 1")).toBeTruthy();
    expect(deviceB.notebooks.notebook(id).topics.has("Topic 2")).toBeTruthy();

    expect(
      deviceB.notebooks.notebook(id).topics.topic("Topic 2")._topic.dateEdited
    ).toBeGreaterThan(
      deviceA.notebooks.notebook(id).topics.topic("Topic 1")._topic.dateEdited
    );
    expect(deviceB.notebooks.notebook(id).dateModified).toBeGreaterThan(
      deviceA.notebooks.notebook(id).dateModified
    );

    await syncAndWait(deviceB, deviceA, false);

    expect(deviceA.notebooks.notebook(id).topics.has("Topic 1")).toBeTruthy();
    expect(deviceB.notebooks.notebook(id).topics.has("Topic 1")).toBeTruthy();

    expect(deviceA.notebooks.notebook(id).topics.has("Topic 2")).toBeTruthy();
    expect(deviceB.notebooks.notebook(id).topics.has("Topic 2")).toBeTruthy();

    console.log("issue new topic log out");
    await cleanup(deviceA, deviceB);
  },
  TEST_TIMEOUT
);

test(
  "issue: assigning 2 notes to the same topic should keep references of both notes in the topic",
  async (ctx) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    const id = await deviceA.notebooks.add({
      title: "Notebook 1",
      topics: ["Topic 1"]
    });

    const topic = deviceA.notebooks.notebook(id).topics.topic("Topic 1");

    await syncAndWait(deviceA, deviceB, false);

    expect(deviceB.notebooks.notebook(id)).toBeDefined();

    const noteA = await deviceA.notes.add({ title: "Note 1" });
    await deviceA.notes.addToNotebook({ id, topic: topic.id }, noteA);

    expect(
      deviceA.notebooks.notebook(id).topics.topic(topic.id).totalNotes
    ).toBe(1);

    await delay(2000);

    const noteB = await deviceB.notes.add({ title: "Note 2" });
    await deviceB.notes.addToNotebook({ id, topic: topic.id }, noteB);

    expect(
      deviceB.notebooks.notebook(id).topics.topic(topic.id).totalNotes
    ).toBe(1);

    ctx.onTestFailed(() => {
      console.log(deviceA.notes.topicReferences.get(topic.id), noteA);
      console.log(deviceB.notes.topicReferences.get(topic.id), noteB);

      deviceB.notes.topicReferences.rebuild();
      deviceA.notes.topicReferences.rebuild();

      console.log(deviceA.notes.topicReferences.get(topic.id), noteA);
      console.log(deviceB.notes.topicReferences.get(topic.id), noteB);
    });
    await syncAndWait(deviceB, deviceA, false);

    expect(deviceA.notes.note(noteB)).toBeDefined();
    expect(deviceB.notes.note(noteA)).toBeDefined();

    expect(deviceA.notes.note(noteA).data.notebooks).toHaveLength(1);
    expect(deviceA.notes.note(noteB).data.notebooks).toHaveLength(1);

    expect(
      deviceA.notebooks.notebook(id).topics.topic(topic.id).totalNotes
    ).toBe(2);
    expect(
      deviceB.notebooks.notebook(id).topics.topic(topic.id).totalNotes
    ).toBe(2);

    console.log("issue assigning 2 notes log out");
    await cleanup(deviceA, deviceB);
  },
  TEST_TIMEOUT
);

/**
 *
 * @param {string} id
 * @returns {Promise<Database>}
 */
async function initializeDevice(id, capabilities = []) {
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

  const device = new Database();
  device.setup(new NodeStorageInterface(), EventSource, FS, Compressor);

  await device.init();

  await login(device);

  await device.user.resetUser(false);

  await device.sync(true, false);

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
      (full, force, lastSynced) => {
        console.log("sync requested by device A", full, force, lastSynced);
        ref2.unsubscribe();
        deviceB.sync(full, force, lastSynced).catch(reject);
      }
    );

    const ref = deviceB.eventManager.subscribe(EVENTS.syncCompleted, () => {
      ref.unsubscribe();
      console.log("sync completed.");
      resolve();
    });

    console.log(
      "waiting for sync...",
      "Device A:",
      deviceA.syncer.sync.syncing,
      "Device B:",
      deviceB.syncer.sync.syncing
    );

    deviceA.sync(true, force).catch(reject);
  });
}

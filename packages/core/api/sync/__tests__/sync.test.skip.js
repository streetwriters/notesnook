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

import Database from "../../index";
import { NodeStorageInterface } from "../../../__mocks__/node-storage.mock";
import FS from "../../../__mocks__/fs.mock";
import Compressor from "../../../__mocks__/compressor.mock";
import { CHECK_IDS, EV, EVENTS } from "../../../common";
import EventSource from "eventsource";
import { delay } from "../../../__tests__/utils";

jest.setTimeout(100 * 1000);

test("case 1: device A & B should only download the changes from device C (no uploading)", async () => {
  const types = [];
  function onSyncProgress({ type }) {
    types.push(type);
  }

  const deviceA = await initializeDevice("deviceA");
  const deviceB = await initializeDevice("deviceB");

  deviceA.eventManager.subscribe(EVENTS.syncProgress, onSyncProgress);
  deviceB.eventManager.subscribe(EVENTS.syncProgress, onSyncProgress);

  const deviceC = await initializeDevice("deviceC");

  await deviceC.notes.add({ title: "new note 1" });
  await syncAndWait(deviceC, deviceC);

  expect(types.every((t) => t === "download")).toBe(true);

  await cleanup(deviceA, deviceB, deviceC);
});

test("case 3: Device A & B have unsynced changes but server has nothing", async () => {
  const deviceA = await initializeDevice("deviceA");
  const deviceB = await initializeDevice("deviceB");

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

  await cleanup(deviceA, deviceA);
});

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

test("issue: running force sync from device A makes device B always download everything", async () => {
  const deviceA = await initializeDevice("deviceA");
  const deviceB = await initializeDevice("deviceB");

  await syncAndWait(deviceA, deviceB, true);

  const handler = jest.fn();
  deviceB.eventManager.subscribe(EVENTS.syncProgress, handler);

  await deviceB.sync(true);

  expect(handler).not.toHaveBeenCalled();

  await cleanup(deviceB);
});

test("issue: colors are not properly created if multiple notes are synced together", async () => {
  const deviceA = await initializeDevice("deviceA", [CHECK_IDS.noteColor]);
  const deviceB = await initializeDevice("deviceB", [CHECK_IDS.noteColor]);

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

  await delay(2000);

  const purpleColor = deviceB.colors.tag("purple");
  expect(noteIds.every((id) => purpleColor.noteIds.indexOf(id) > -1)).toBe(
    true
  );

  await cleanup(deviceA, deviceB);
});

test("issue: new topic on device A gets replaced by the new topic on device B", async () => {
  const deviceA = await initializeDevice("deviceA");
  const deviceB = await initializeDevice("deviceB");

  const id = await deviceA.notebooks.add({ title: "Notebook 1" });

  await syncAndWait(deviceA, deviceB, false);

  expect(deviceB.notebooks.notebook(id)).toBeDefined();

  await deviceA.notebooks.notebook(id).topics.add("Topic 1");

  // to create a conflict
  await delay(1500);

  await deviceB.notebooks.notebook(id).topics.add("Topic 2");

  expect(deviceA.notebooks.notebook(id).topics.has("Topic 1")).toBeTruthy();

  expect(deviceB.notebooks.notebook(id).topics.has("Topic 2")).toBeTruthy();

  await syncAndWait(deviceA, deviceB, false);

  await delay(1000);

  await syncAndWait(deviceB, deviceB, false);

  expect(deviceA.notebooks.notebook(id).topics.has("Topic 1")).toBeTruthy();
  expect(deviceB.notebooks.notebook(id).topics.has("Topic 1")).toBeTruthy();

  expect(deviceA.notebooks.notebook(id).topics.has("Topic 2")).toBeTruthy();
  expect(deviceB.notebooks.notebook(id).topics.has("Topic 2")).toBeTruthy();

  await cleanup(deviceA, deviceB);
});

test("issue: remove notebook reference from notes that are removed from topic during merge", async () => {
  const deviceA = await initializeDevice("deviceA");
  const deviceB = await initializeDevice("deviceB");

  const id = await deviceA.notebooks.add({
    title: "Notebook 1",
    topics: ["Topic 1"]
  });

  await syncAndWait(deviceA, deviceB, false);

  expect(deviceB.notebooks.notebook(id)).toBeDefined();

  const noteA = await deviceA.notes.add({ title: "Note 1" });
  await deviceA.notes.addToNotebook({ id, topic: "Topic 1" }, noteA);

  expect(
    deviceA.notebooks.notebook(id).topics.topic("Topic 1").totalNotes
  ).toBe(1);

  await delay(2000);

  const noteB = await deviceB.notes.add({ title: "Note 2" });
  await deviceB.notes.addToNotebook({ id, topic: "Topic 1" }, noteB);

  expect(
    deviceB.notebooks.notebook(id).topics.topic("Topic 1").totalNotes
  ).toBe(1);

  await syncAndWait(deviceB, deviceA, false);

  expect(
    deviceA.notebooks.notebook(id).topics.topic("Topic 1").totalNotes
  ).toBe(1);
  expect(
    deviceB.notebooks.notebook(id).topics.topic("Topic 1").totalNotes
  ).toBe(1);

  expect(deviceA.notes.note(noteA).data.notebooks).toHaveLength(0);

  await cleanup(deviceA, deviceB);
});

/**
 *
 * @param {string} id
 * @returns {Promise<Database>}
 */
async function initializeDevice(id, capabilities = []) {
  console.time("Init device");
  EV.subscribe(EVENTS.userCheckStatus, async (type) => {
    return {
      type,
      result: capabilities.indexOf(type) > -1
    };
  });

  const device = new Database(
    new NodeStorageInterface(),
    EventSource,
    FS,
    Compressor
  );
  // device.host({
  //   API_HOST: "http://192.168.10.29:5264",
  //   AUTH_HOST: "http://192.168.10.29:8264",
  //   SSE_HOST: "http://192.168.10.29:7264",
  //   ISSUES_HOST: "http://192.168.10.29:2624",
  //   SUBSCRIPTIONS_HOST: "http://192.168.10.29:9264",
  // });

  await device.init(id);

  await device.user.login(
    process.env.EMAIL,
    process.env.PASSWORD,
    process.env.HASHED_PASSWORD
  );

  await device.user.resetUser(false);

  device.eventManager.subscribe(
    EVENTS.databaseSyncRequested,
    async (full, force) => {
      await device.sync(full, force);
    }
  );

  console.timeEnd("Init device");
  return device;
}

async function cleanup(...devices) {
  for (let device of devices) {
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
  return new Promise((resolve) => {
    const ref = deviceB.eventManager.subscribe(EVENTS.syncCompleted, () => {
      ref.unsubscribe();
      resolve();
    });
    deviceA.sync(true, force);
  });
}

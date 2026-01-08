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

import { EVENTS } from "../src/common.ts";
import { test, expect, vitest, vi, beforeAll, afterAll } from "vitest";
import { login } from "./utils.js";
import { databaseTest, delay } from "../__tests__/utils/index.ts";
import http from "../src/utils/http.ts";
import Constants from "../src/utils/constants.ts";
import { writeFileSync } from "node:fs";
import dayjs from "dayjs";

const TEST_TIMEOUT = 60 * 1000;
const testOptions = { concurrent: true, timeout: TEST_TIMEOUT };

beforeAll(async () => {
  const device = await databaseTest("memory");

  await login(device);

  await device.user.resetUser(false);

  await device.user.logout();
}, TEST_TIMEOUT);

afterAll(async () => {
  const device = await databaseTest("memory");

  await login(device);

  await device.user.resetUser(false);

  await device.user.logout();
}, TEST_TIMEOUT);

test(
  "case 1: device A & B should only download the changes from device C (no uploading)",
  testOptions,
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
  }
);

test(
  "case 3: Device A & B have unsynced changes but server has nothing",
  testOptions,
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
  }
);

test(
  "edge case 1: items updated while push is running",
  testOptions,
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
      var spy = vi.spyOn(deviceA.syncer.sync, "start");
      const defaultEncryptMulti = deviceA
        .storage()
        .encryptMulti.bind(deviceA.storage());
      var encryptMulti = vi.spyOn(deviceA.storage(), "encryptMulti");
      encryptMulti.mockImplementationOnce(async (...args) => {
        const result = defaultEncryptMulti(...args);
        // simulate scenario where a note gets updated while sync is collecting
        // items
        await new Promise((resolve) => setTimeout(resolve, 100));
        await deviceA.notes.add({ id, title: `edit ${i}` });
        return result;
      });
      await deviceA.sync({ type: "send" });
      expect(spy).toHaveBeenCalledTimes(2);
      expect((await deviceA.notes.note(id))?.title).toBe(`edit ${i}`);
      expect((await deviceA.notes.note(id))?.synced).toBe(true);
      await deviceB.sync({ type: "fetch" });
      expect((await deviceB.notes.note(id))?.title).toBe(`edit ${i}`);
    }
  }
);

test(
  "edge case 2: new items added while push is running",
  testOptions,
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
      var spy = vi.spyOn(deviceA.syncer.sync, "start");
      const defaultEncryptMulti = deviceA
        .storage()
        .encryptMulti.bind(deviceA.storage());
      var encryptMulti = vi.spyOn(deviceA.storage(), "encryptMulti");
      let newNoteId;
      encryptMulti.mockImplementationOnce(async (key, items) => {
        const result = defaultEncryptMulti(key, items);
        // simulate scenario where a note gets added while sync is collecting
        // items
        await new Promise((resolve) => setTimeout(resolve, 100));
        newNoteId = await deviceA.notes.add({ title: `note ${i}` });
        return result;
      });
      await deviceA.sync({ type: "send" });
      expect(await deviceA.notes.note(newNoteId)).toBeDefined();
      expect((await deviceA.notes.note(newNoteId)).synced).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      await deviceB.sync({ type: "fetch" });
      expect(await deviceB.notes.note(newNoteId)).toBeDefined();
    }
  }
);

test(
  "issue: syncing should not affect the items' dateModified",
  testOptions,
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
  }
);

test(
  "case 4: local content changed after remote content should create a conflict",
  testOptions,
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async (r) => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    t.onTestFailed(() => {
      writeFileSync("debug_deviceA_note.json", content);
    });

    var noteId = await deviceA.notes.add({
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

    await delay(2500);

    await deviceA.notes.add({
      id: noteId,
      content: { data: "<p>Hello (I am from device A)</p>", type: "tiptap" }
    });
    await deviceA.sync({ type: "full" });
    var content = JSON.stringify(await deviceA.content.findByNoteId(noteId));
    expect(await deviceA.notes.conflicted.count()).toBeGreaterThan(0);
  }
);

test(
  "case 5: remote content changed after local content should create a conflict",
  testOptions,
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async (r) => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });
    // t.onTestFailed(() => {
    //   writeFileSync("debug_deviceB_note.json", content);
    // });

    deviceB.syncer.sync.merger.forceLogging = true;
    deviceB.syncer.sync.collector.forceLogging = true;
    var noteId = await deviceA.notes.add({
      title: "Test note from device A",
      content: { data: "<p>Hello unique note</p>", type: "tiptap" }
    });
    console.log("Device A is syncing (A)");
    await deviceA.sync({ type: "full" });
    console.log("Device B is syncing (A)");
    await deviceB.sync({ type: "full" });

    await deviceA.notes.add({
      id: noteId,
      content: {
        data: "<p>Hello (unique note edit) device A</p>",
        type: "tiptap"
      }
    });
    console.log("Device A is syncing (B)");
    await deviceA.sync({ type: "full" });

    await delay(2500);

    await deviceB.notes.add({
      id: noteId,
      content: {
        data: "<p>Hello unique note edit (device B)</p>",
        type: "tiptap"
      }
    });
    expect((await deviceB.content.findByNoteId(noteId)).synced).toBe(false);
    console.log("Syncing device B");
    await deviceB.sync({ type: "full" });
    // // var content = JSON.stringify(await deviceB.content.findByNoteId(noteId));
    expect(await deviceB.notes.conflicted.count()).toBeGreaterThan(0);
  }
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
  testOptions,
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

    const handler = vitest.fn();
    deviceB.eventManager.subscribe(EVENTS.syncProgress, handler);

    await syncAndWait(deviceA, deviceB, true);

    expect(handler.mock.calls.every(([data]) => data.type === "download")).toBe(
      true
    );
  }
);

test(
  "issue: colors are not properly created if multiple notes are synced together",
  testOptions,
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
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
      // console.log(
      //   "Adding color to note",
      //   noteId,
      //   await deviceB.syncer.devices.get()
      // );
      expect(await deviceB.notes.note(noteId)).toBeDefined();
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
  }
);

test(
  "monograph: published note appears on other device after sync",
  testOptions,
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async () => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    const noteId = await deviceA.notes.add({
      title: "Monograph note",
      content: { data: "<p>monograph content</p>", type: "tiptap" }
    });

    // publish on device A
    const monographId = await deviceA.monographs.publish(noteId);
    expect(monographId).toBeTruthy();

    // deviceB fetches the monograph
    await deviceB.sync({ type: "fetch" });

    expect(deviceB.monographs.isPublished(noteId)).toBeTruthy();

    const mono = await deviceB.monographs.get(noteId);
    expect(mono).toBeTruthy();
    expect(mono.title).toBe("Monograph note");
  }
);

test(
  "monograph: self-destruct triggers unpublish across devices",
  testOptions,
  async (t) => {
    const [deviceA, deviceB, deviceC] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB"),
      initializeDevice("deviceC")
    ]);

    t.onTestFinished(async () => {
      //  console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB, deviceC);
    });

    const noteId = await deviceA.notes.add({
      title: "Self destruct monograph",
      content: { data: "<p>transient</p>", type: "tiptap" }
    });

    // publish with selfDestruct
    const monographId = await deviceA.monographs.publish(noteId, {
      selfDestruct: true
    });
    expect(monographId).toBeTruthy();

    // ensure all devices know it's published
    await deviceA.sync({ type: "fetch" });
    await deviceB.sync({ type: "fetch" });
    await deviceC.sync({ type: "fetch" });

    expect(deviceB.monographs.isPublished(noteId)).toBeTruthy();
    expect(deviceC.monographs.isPublished(noteId)).toBeTruthy();

    // trigger a view on the public endpoint which should cause self-destruct
    await http
      .get(`${Constants.API_HOST}/monographs/${noteId}/view`)
      .catch(() => {});

    // give the server a short moment to process
    await delay(500);

    // sync all devices to pick up the unpublish
    await deviceA.sync({ type: "fetch" });
    await deviceB.sync({ type: "fetch" });
    await deviceC.sync({ type: "fetch" });

    expect(deviceA.monographs.isPublished(noteId)).toBeFalsy();
    expect(deviceB.monographs.isPublished(noteId)).toBeFalsy();
    expect(deviceC.monographs.isPublished(noteId)).toBeFalsy();
  }
);

test(
  "monograph: properties (password and selfDestruct) sync across devices",
  testOptions,
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async () => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    const password = "s3cr3t";

    const noteId = await deviceA.notes.add({
      title: "Protected monograph",
      content: { data: "<p>secret content</p>", type: "tiptap" }
    });

    // publish with password and selfDestruct on device A
    const monographId = await deviceA.monographs.publish(noteId, {
      password,
      selfDestruct: true
    });
    expect(monographId).toBeTruthy();

    // deviceB fetches the monograph
    await deviceB.sync({ type: "fetch" });

    expect(deviceB.monographs.isPublished(noteId)).toBeTruthy();

    const mono = await deviceB.monographs.get(noteId);
    expect(mono).toBeTruthy();
    expect(mono.selfDestruct).toBe(true);
    expect(mono.password).toBeTruthy();

    const decrypted = await deviceB.monographs.decryptPassword(mono.password);
    expect(decrypted).toBe(password);
  }
);

test(
  "edge case: deletion on one device propagates to others",
  testOptions,
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async () => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    const id = await deviceA.notes.add({ title: "note to delete" });

    // ensure both devices have latest state where note exists
    await deviceA.sync({ type: "full" });
    await deviceB.sync({ type: "full" });
    expect(await deviceB.notes.note(id)).toBeTruthy();

    // delete on deviceA
    await deviceA.notes.remove(id);
    await deviceA.sync({ type: "full" });

    // deviceB should observe deletion after syncing
    await deviceB.sync({ type: "full" });
    expect(await deviceB.notes.note(id)).toBeFalsy();
  }
);

test(
  "stress: sync 5000 notes from device A to device B",
  testOptions,
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async () => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    for (let i = 0; i < 5000; ++i) {
      await deviceA.notes.add({
        title: `note ${i}`,
        content: {
          type: "tiptap",
          data: `<p>deviceA=true</p>`
        }
      });
    }

    await deviceA.sync({ type: "full" });
    await deviceB.sync({ type: "full" });

    const countA = await deviceA.notes.all.count();
    const countB = await deviceB.notes.all.count();

    expect(countA).toBeGreaterThanOrEqual(5000);
    expect(countB).toBeGreaterThanOrEqual(5000);
  }
);

test("stress: super concurrent sync", testOptions, async (t) => {
  console.time("adding devices");
  const devices = await Promise.all(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      .split("")
      .map((letter) => initializeDevice(`device${letter}`))
  );
  console.timeEnd("adding devices");

  t.onTestFinished(async () => {
    console.log(`${t.task.name} log out`);
    await cleanup(...devices);
  });

  await Promise.all(
    devices.map(async (device, index) => {
      for (let i = 0; i < 100; ++i) {
        await device.notes.add({
          content: {
            type: "tiptap",
            data: `<p>device${i}${index}=true</p>`
          }
        });
      }
    })
  );

  await Promise.all(
    devices.map(async (device) => {
      await device.sync({ type: "send" });
    })
  );

  await Promise.all(
    devices.map(async (device) => {
      await device.sync({ type: "fetch" });
    })
  );

  for (const device of devices) {
    // await device.sync({ type: "full" });

    expect(await device.notes.all.count()).toBeGreaterThanOrEqual(
      devices.length * 100
    );
  }
});

/**
 *
 * @param {string} id
 * @returns {Promise<import("../src/api/index.ts").default>}
 */
async function initializeDevice(id) {
  // initialize(new NodeStorageInterface(), false);

  // console.time(`Init ${id}`);

  const device = await databaseTest("memory");

  console.time("login" + id);
  await login(device);
  console.timeEnd("login" + id);

  // await device.user.resetUser(false);

  await device.sync({ type: "full" });

  // console.timeEnd(`Init ${id}`);
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
  // EV.unsubscribeAll();
}

/**
 *
 * @param {import("../src/api/index.ts").default} deviceA
 * @param {import("../src/api/index.ts").default} deviceB
 * @returns
 */
function syncAndWait(deviceA, deviceB, force = false) {
  return new Promise((resolve, reject) => {
    const ref2 = deviceB.eventManager.subscribe(
      EVENTS.databaseSyncRequested,
      async (full, force, deviceId) => {
        if (!full) return;
        if (deviceId !== (await deviceA.syncer.devices.get())) {
          console.warn(
            "Concurrency error. Expected:",
            await deviceA.syncer.devices.get(),
            "Got:",
            deviceId
          );
          return;
        }

        console.log("sync requested by device A:", deviceId, full, force);

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

    // console.log(
    //   "waiting for sync...",
    //   "Device A:",
    //   deviceA.syncer.sync.syncing,
    //   "Device B:",
    //   deviceB.syncer.sync.syncing
    // );

    deviceA.sync({ type: "full", force }).catch(reject);
  });
}

test.only(
  "test expiring notes auto delete from device B (offline) while device A changes expiryDate val",
  async (t) => {
    const [deviceA, deviceB] = await Promise.all([
      initializeDevice("deviceA"),
      initializeDevice("deviceB")
    ]);

    t.onTestFinished(async () => {
      console.log(`${t.task.name} log out`);
      await cleanup(deviceA, deviceB);
    });

    const noteId = await deviceA.notes.add({
      content: {
        type: "tiptap",
        data: `<p>Test</p>`
      }
    });
    await deviceA.notes.setExpiryDate(
      dayjs().add(3, "second").toDate().getTime(),
      noteId
    );

    await deviceA.sync({ type: "full" });
    await delay(1000);
    await deviceB.sync({ type: "full" });

    expect(await deviceA.notes.note(noteId)).toBeTruthy();
    expect(await deviceB.notes.note(noteId)).toBeTruthy();

    await delay(3000);

    await deviceB.notes.deleteExpiredNotes();

    await delay(1000);

    await deviceA.notes.setExpiryDate(null, noteId);

    expect(await deviceA.notes.note(noteId)).toBeTruthy();
    expect(await deviceB.notes.note(noteId)).toBeFalsy();

    await deviceA.sync({ type: "full" });
    await delay(1000);
    await deviceB.sync({ type: "full" });
    await delay(1000);

    expect(await deviceA.notes.note(noteId)).toBeTruthy();
    expect(await deviceB.notes.note(noteId)).toBeTruthy();
  },
  TEST_TIMEOUT
);

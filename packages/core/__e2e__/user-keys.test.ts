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

import { test, expect, vi, afterEach } from "vitest";
import { databaseTest } from "../__tests__/utils/index.ts";
import { KeyManager } from "../src/api/key-manager.js";
import http from "../src/utils/http.js";
import { EVENTS } from "../src/common.js";
import { login, USER } from "./utils.js";

const NEW_PASSWORD = `${USER.password}-new`;

afterEach(() => {
  vi.restoreAllMocks();
});

async function changePassword(db: any) {
  await db.user.changePassword(USER.password, NEW_PASSWORD);
}

async function restorePassword(db: any) {
  await db.user.changePassword(NEW_PASSWORD, USER.password);
}

async function collectNotes(db: any) {
  const chunks: any[] = [];
  for await (const chunk of db.syncer.sync.collector.collect(100))
    if (chunk.type === "note") chunks.push(chunk);
  return chunks;
}

// what another device does when it receives these items
async function receive(db: any, chunks: any[]) {
  await db.user.fetchUser();
  const keys = await db.user.getDataEncryptionKeys();
  for (const chunk of chunks)
    await db.syncer.sync.processChunk(chunk, keys, { type: "full" });
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

function keyVersions(chunks: any[]) {
  return chunks.flatMap((c) => c.items.map((i: any) => i.keyVersion));
}

async function unwrapDataEncryptionKey(db: any) {
  return await new KeyManager(db).unwrapKey(
    (
      await db.user.getUser()
    ).dataEncryptionKey,
    await db.user.getMasterKey()
  );
}

async function storeKeysNewerThanMasterKey(db: any) {
  const user = await db.user.getUser();
  // e.g. the app was closed right after a password change stored the user
  await db.user.setUser({
    ...user,
    revision: user.revision + 1,
    dataEncryptionKey: await new KeyManager(db).wrapKey(
      await db.crypto().generateRandomKey(),
      await db.storage().generateCryptoKey(NEW_PASSWORD, user.salt)
    )
  });
}

test(
  "sync during a password change fails instead of using the wrong key",
  () =>
    databaseTest().then(async (db) => {
      await login(db);
      await db.notes.add({ title: "note" });
      const sessionExpired = vi.fn();
      db.eventManager.subscribe(EVENTS.userSessionExpired, sessionExpired);
      let collectDuringChange!: Promise<unknown>;
      const storage = db.storage();
      const derive = storage.deriveCryptoKey.bind(storage);
      // the new user is already stored but the master key is still the old one
      vi.spyOn(storage, "deriveCryptoKey").mockImplementationOnce(
        async (credentials) => {
          collectDuringChange = collectNotes(db).catch((e) => e);
          await collectDuringChange;
          await derive(credentials);
        }
      );

      await changePassword(db);
      try {
        expect(await collectDuringChange).toBeInstanceOf(Error);
        expect(sessionExpired).not.toHaveBeenCalled();
        const pushed = await collectNotes(db);
        expect(keyVersions(pushed)).toStrictEqual([1]);
        await expect(receive(db, pushed)).resolves.toBeUndefined();
      } finally {
        await restorePassword(db);
      }
    }),
  60000
);

test(
  "keys newer than the master key expire the session",
  () =>
    databaseTest().then(async (db) => {
      await login(db);
      const sessionExpired = vi.fn();
      db.eventManager.subscribe(EVENTS.userSessionExpired, sessionExpired);
      await storeKeysNewerThanMasterKey(db);

      await expect(db.user.getDataEncryptionKeys()).rejects.toThrow();
      expect(sessionExpired).toHaveBeenCalled();
    }),
  30000
);

test(
  "keys newer than the master key don't expire the session while another tab changes the master key",
  () =>
    databaseTest().then(async (db) => {
      await login(db);
      const sessionExpired = vi.fn();
      db.eventManager.subscribe(EVENTS.userSessionExpired, sessionExpired);
      await storeKeysNewerThanMasterKey(db);
      await db.kv().write("masterKeyChangeStartedAt", Date.now());

      await expect(db.user.getDataEncryptionKeys()).rejects.toThrow();
      expect(sessionExpired).not.toHaveBeenCalled();
    }),
  30000
);

test(
  "keys newer than the master key expire the session if a master key change was interrupted",
  () =>
    databaseTest().then(async (db) => {
      await login(db);
      const sessionExpired = vi.fn();
      db.eventManager.subscribe(EVENTS.userSessionExpired, sessionExpired);
      await storeKeysNewerThanMasterKey(db);
      await db.kv().write("masterKeyChangeStartedAt", Date.now() - 60 * 1000);

      await expect(db.user.getDataEncryptionKeys()).rejects.toThrow();
      expect(sessionExpired).toHaveBeenCalled();
    }),
  30000
);

test(
  "older user doesn't replace a newer one",
  () =>
    databaseTest().then(async (db) => {
      await login(db);
      const preChangeUser = await db.user.getUser();
      await changePassword(db);
      try {
        // e.g. written by another tab that still had the old user
        await db.user.setUser(preChangeUser!);

        await expect(unwrapDataEncryptionKey(db)).resolves.toBeDefined();
        await db.notes.add({ title: "note" });
        expect(keyVersions(await collectNotes(db))).toStrictEqual([1]);
      } finally {
        await restorePassword(db);
      }
    }),
  60000
);

test(
  "user fetched before a password change doesn't overwrite the new keys",
  () =>
    databaseTest().then(async (db) => {
      await login(db);
      const getStarted = deferred();
      const releaseGet = deferred();
      const get = http.get;
      vi.spyOn(http, "get").mockImplementationOnce(async (...args) => {
        const preChangeUser = await get(...args);
        getStarted.resolve();
        await releaseGet.promise;
        return preChangeUser;
      });

      const fetchUser = db.user.fetchUser();
      await getStarted.promise;
      await changePassword(db);
      try {
        releaseGet.resolve();
        await fetchUser;

        await expect(unwrapDataEncryptionKey(db)).resolves.toBeDefined();
      } finally {
        await restorePassword(db);
      }
    }),
  60000
);

test(
  "password change whose response is lost still switches to the new password",
  () =>
    databaseTest().then(async (db) => {
      await login(db);
      const patch = http.patch.json;
      vi.spyOn(http.patch, "json").mockImplementationOnce(async (...args) => {
        await patch(...args);
        throw new Error("Network error.");
      });

      await changePassword(db);
      try {
        const { salt } = (await db.user.getUser())!;
        expect(await db.user.getMasterKey()).toStrictEqual(
          await db.storage().generateCryptoKey(NEW_PASSWORD, salt)
        );
        await expect(unwrapDataEncryptionKey(db)).resolves.toBeDefined();
      } finally {
        await restorePassword(db);
      }
    }),
  60000
);

test(
  "password change that failed before changing anything keeps the old password",
  () =>
    databaseTest().then(async (db) => {
      await login(db);
      const masterKey = await db.user.getMasterKey();
      vi.spyOn(http.patch, "json").mockRejectedValueOnce(
        new Error("Network error.")
      );

      await expect(changePassword(db)).rejects.toThrow("Network error.");

      expect(await db.user.getMasterKey()).toStrictEqual(masterKey);
      await expect(unwrapDataEncryptionKey(db)).resolves.toBeDefined();
    }),
  30000
);

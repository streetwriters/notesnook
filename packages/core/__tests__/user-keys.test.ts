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

// Server states that only a failure produces (keys left pending by a password
// change, a missing key, a session that wasn't revoked). The rest is covered
// against a real server in __e2e__/user-keys.test.ts.
import { test, expect, vi } from "vitest";
import { databaseTest } from "./utils/index.ts";
import { KeyManager } from "../src/api/key-manager.js";
import { randomBytes } from "../src/utils/random.js";

// in-memory fake API server holding the user document
const server: any = { user: undefined, hooks: {} };
const KEY_IDS = [
  "attachmentsKey",
  "monographPasswordsKey",
  "dataEncryptionKey",
  "legacyDataEncryptionKey",
  "inboxKeys"
];
vi.mock("../src/utils/http.js", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("../src/utils/http.js")
  >();
  const conflict = (code: string) =>
    new original.RequestError({ code, description: code, data: undefined });
  const keysChanged = () => conflict("keys_changed");
  const user = () => JSON.parse(JSON.stringify(server.user));
  return {
    ...original,
    default: {
      get: vi.fn(async (url: string) => {
        if (server.hooks.get) return server.hooks.get(url);
        if (url.endsWith("/users")) return user();
      }),
      post: Object.assign(
        vi.fn(async (url: string) => server.hooks.post?.(url)),
        {
          json: vi.fn(async (url: string, body: any) => {
            const pending = url.match(
              /\/users\/keys\/pending\/(commit|discard)/
            );
            if (pending) {
              if (
                Number(new URL(url).searchParams.get("revision")) !==
                server.user.revision
              )
                throw keysChanged();
              if (pending[1] === "commit") {
                server.hooks.onCommitPendingKeys?.();
                Object.assign(server.user, server.user.pendingKeys);
              } else server.hooks.onDiscardPendingKeys?.();
              delete server.user.pendingKeys;
              server.user.revision++;
              return user();
            }
            if (!url.includes("/users/keys")) return;
            await server.hooks.beforeKeysCreate?.(body);
            const revision = new URL(url).searchParams.get("revision");
            if (revision !== null && +revision < server.masterKeyRevision)
              throw conflict("password_changed");
            for (const id in body) {
              if (server.user[id]) continue;
              server.user[id] = body[id];
              server.user.revision++;
            }
            return user();
          })
        }
      ),
      patch: {
        json: vi.fn(async (url: string, body: any) => {
          if (!url.includes("/users/password/")) return;
          server.hooks.beforePasswordPatch?.(body);
          if (
            (body.revision !== undefined &&
              body.revision !== server.user.revision) ||
            KEY_IDS.some((id) => server.user[id] && !body.userKeys[id])
          )
            throw keysChanged();
          Object.assign(server.user, body.userKeys);
          server.masterKeyRevision = ++server.user.revision;
          return user();
        })
      },
      delete: vi.fn().mockResolvedValue(undefined)
    }
  };
});

const SUBSCRIPTION = {
  appId: 0,
  cancelURL: null,
  expiry: 0,
  productId: null,
  provider: "none",
  start: 0,
  plan: "free",
  status: "trial",
  updateURL: null,
  googlePurchaseToken: null
};

// A pre-DEK ("legacy") account: data is encrypted directly with the master key.
async function setupLegacyUser(db: any) {
  server.hooks = {};
  server.masterKeyRevision = 0;
  const salt = randomBytes(16).toString("base64");
  const user: any = {
    id: "user",
    email: "test@example.com",
    isEmailConfirmed: true,
    salt,
    mfa: { isEnabled: false },
    subscription: SUBSCRIPTION,
    revision: 0
  };
  await db.storage().deriveCryptoKey({ password: "old", salt });
  await db.kv().write("token", {
    access_token: "fake-token",
    t: Date.now(),
    expires_in: 3600,
    scope: "notesnook.sync offline_access IdentityServerApi",
    refresh_token: "fake-refresh"
  });
  await db.user.setUser(user);
  await db.kv().write("masterKeyRevision", 0);
  user.attachmentsKey = await new KeyManager(db).wrapKey(
    await db.crypto().generateRandomKey(),
    (await db.user.getMasterKey())!
  );
  server.user = JSON.parse(JSON.stringify(user));
  await db.user.fetchUser();
}

// what logging in does once the server accepted the password
async function logIn(db: any, password: string) {
  const user = await db.user.fetchUser();
  await db.user.setMasterKey(user, { password });
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

async function wrapForPassword(db: any, password: string) {
  const { salt } = (await db.user.getUser())!;
  return await new KeyManager(db).wrapKey(
    await db.crypto().generateRandomKey(),
    await db.storage().generateCryptoKey(password, salt)
  );
}

test("key generated during password change is rewrapped with the new master key", () =>
  databaseTest().then(async (db) => {
    await setupLegacyUser(db);
    const createStarted = deferred();
    const releaseCreate = deferred();
    server.hooks.beforeKeysCreate = async () => {
      server.hooks.beforeKeysCreate = undefined;
      createStarted.resolve();
      await releaseCreate.promise;
    };

    // wrapped with the old master key; the request lands after the change
    const generateKey = db.user.getMonographPasswordsKey();
    await createStarted.promise;
    await db.user.changePassword("old", "new");
    releaseCreate.resolve();
    const key = await generateKey;

    const masterKey = (await db.user.getMasterKey())!;
    const keyManager = new KeyManager(db);
    for (const user of [server.user, await db.user.getUser()]) {
      expect(user.dataEncryptionKey).toBeDefined();
      expect(
        await keyManager.unwrapKey(user.monographPasswordsKey, masterKey)
      ).toStrictEqual(key);
    }
  }));

test("concurrent requests for a missing key end up with the same key", () =>
  databaseTest().then(async (db) => {
    await setupLegacyUser(db);
    const user = (await db.user.getUser())!;
    delete user.attachmentsKey;
    delete server.user.attachmentsKey;
    await db.user.setUser(user);

    const [first, second] = await Promise.all([
      db.user.getAttachmentsKey(),
      db.user.getAttachmentsKey()
    ]);

    expect(first).toStrictEqual(second);
  }));

test("missing key created by another device first is adopted", () =>
  databaseTest().then(async (db) => {
    await setupLegacyUser(db);
    const keyManager = new KeyManager(db);
    const masterKey = (await db.user.getMasterKey())!;
    const otherDeviceKey = await db.crypto().generateRandomKey();
    server.hooks.beforeKeysCreate = async () => {
      server.user.monographPasswordsKey = await keyManager.wrapKey(
        otherDeviceKey,
        masterKey
      );
    };

    const key = await db.user.getMonographPasswordsKey();

    expect(key).toStrictEqual(otherDeviceKey);
    expect((await db.user.getUser())?.monographPasswordsKey).toStrictEqual(
      server.user.monographPasswordsKey
    );
  }));

test("password change retries with keys added on another device", () =>
  databaseTest().then(async (db) => {
    await setupLegacyUser(db);
    const keyManager = new KeyManager(db);
    const monographPasswordsKey = await db.crypto().generateRandomKey();
    // added on another device; this device doesn't know about it yet
    server.user.monographPasswordsKey = await keyManager.wrapKey(
      monographPasswordsKey,
      (await db.user.getMasterKey())!
    );

    await db.user.changePassword("old", "new");

    const masterKey = (await db.user.getMasterKey())!;
    expect(
      await keyManager.unwrapKey(server.user.monographPasswordsKey, masterKey)
    ).toStrictEqual(monographPasswordsKey);
  }));

test("password change retries if the user changed since it was fetched", () =>
  databaseTest().then(async (db) => {
    await setupLegacyUser(db);
    // e.g. inbox keys replaced on another device
    server.user.revision = 1;
    const revisions: number[] = [];
    server.hooks.beforePasswordPatch = (body: any) =>
      revisions.push(body.revision);

    await db.user.changePassword("old", "new");

    expect(revisions).toStrictEqual([0, 1]);
    expect((await db.user.getUser())?.revision).toBe(2);
  }));

test("keys of a password change that failed midway are committed when logging in with the new password", () =>
  databaseTest().then(async (db) => {
    await setupLegacyUser(db);
    const keyManager = new KeyManager(db);
    const dataEncryptionKey = await db.crypto().generateRandomKey();
    const { salt } = (await db.user.getUser())!;
    server.user.pendingKeys = {
      dataEncryptionKey: await keyManager.wrapKey(
        dataEncryptionKey,
        await db.storage().generateCryptoKey("new", salt)
      )
    };

    await logIn(db, "new");

    const user = await db.user.getUser();
    expect(user?.pendingKeys).toBeUndefined();
    expect(
      await keyManager.unwrapKey(
        user!.dataEncryptionKey!,
        (await db.user.getMasterKey())!
      )
    ).toStrictEqual(dataEncryptionKey);
  }));

test("logging in fails without changing anything if the pending keys can't be committed", () =>
  databaseTest().then(async (db) => {
    await setupLegacyUser(db);
    server.user.pendingKeys = {
      dataEncryptionKey: await wrapForPassword(db, "new")
    };
    server.hooks.onCommitPendingKeys = () => {
      throw new Error("Network error.");
    };
    const masterKey = await db.user.getMasterKey();

    await expect(logIn(db, "new")).rejects.toThrow("Network error.");

    expect(await db.user.getMasterKey()).toStrictEqual(masterKey);
    expect(await db.kv().read("masterKeyChangeStartedAt")).toBeUndefined();
  }));

test("keys of a password change that failed midway are discarded when logging in with another password", () =>
  databaseTest().then(async (db) => {
    await setupLegacyUser(db);
    server.user.pendingKeys = {
      dataEncryptionKey: await wrapForPassword(db, "new")
    };
    const commit = vi.fn();
    const discard = vi.fn();
    server.hooks.onCommitPendingKeys = commit;
    server.hooks.onDiscardPendingKeys = discard;

    await logIn(db, "old");

    expect(commit).not.toHaveBeenCalled();
    expect(discard).toHaveBeenCalled();
    expect((await db.user.getUser())?.pendingKeys).toBeUndefined();
    expect((await db.user.getUser())?.dataEncryptionKey).toBeUndefined();
  }));

test("logging in with another password succeeds even if the pending keys can't be discarded", () =>
  databaseTest().then(async (db) => {
    await setupLegacyUser(db);
    server.user.pendingKeys = {
      dataEncryptionKey: await wrapForPassword(db, "new")
    };
    server.hooks.onDiscardPendingKeys = () => {
      throw new Error("Network error.");
    };

    await expect(logIn(db, "old")).resolves.toBeUndefined();
    expect(await db.user.getMasterKey()).toBeDefined();
  }));

test("failed login stores nothing", () =>
  databaseTest().then(async (db) => {
    await setupLegacyUser(db);
    await db.kv().delete("user");
    await db.kv().write("token", {
      access_token: "fake-token",
      t: Date.now(),
      expires_in: 3600,
      scope: "auth:grant_types:mfa_password"
    } as any);
    server.hooks.post = async (url: string) => {
      if (url.endsWith("/connect/token"))
        return {
          access_token: "fake-token",
          expires_in: 3600,
          scope: "notesnook.sync offline_access IdentityServerApi",
          refresh_token: "fake-refresh"
        };
    };
    server.user.pendingKeys = {
      dataEncryptionKey: await new KeyManager(db).wrapKey(
        await db.crypto().generateRandomKey(),
        await db.storage().generateCryptoKey("new", server.user.salt)
      )
    };
    server.hooks.onCommitPendingKeys = () => {
      throw new Error("Network error.");
    };

    await expect(
      db.user.authenticatePassword("test@example.com", "new", undefined, true)
    ).rejects.toThrow("Network error.");

    expect(await db.user.getUser()).toBeUndefined();
  }));

test("key created after a password change on another device is rejected", () =>
  databaseTest().then(async (db) => {
    await setupLegacyUser(db);
    const keyManager = new KeyManager(db);
    const oldMasterKey = (await db.user.getMasterKey())!;
    // this device's session wasn't revoked, so it still has the old master key
    const newMasterKey = await db
      .storage()
      .generateCryptoKey("new", server.user.salt);
    server.user.attachmentsKey = await keyManager.rewrapKey(
      server.user.attachmentsKey,
      oldMasterKey,
      newMasterKey
    );
    server.masterKeyRevision = ++server.user.revision;
    await db.user.fetchUser();

    await expect(db.user.getMonographPasswordsKey()).rejects.toThrow();
    expect(server.user.monographPasswordsKey).toBeUndefined();
  }));

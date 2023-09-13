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
  checkSyncStatus,
  EV,
  EVENTS,
  sendAttachmentsProgressEvent,
  sendSyncProgressEvent,
  SYNC_CHECK_IDS
} from "../../common";
import Constants from "../../utils/constants";
import TokenManager from "../token-manager";
import Collector from "./collector";
import * as signalr from "@microsoft/signalr";
import Merger from "./merger";
import Conflicts from "./conflicts";
import { AutoSync } from "./auto-sync";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { logger } from "../../logger";
import { Mutex } from "async-mutex";
import { migrateItem } from "../../migrations";

/**
 * @typedef {{
 *  items: any[],
 *  type: string,
 * }} SyncTransferItem
 */

export default class SyncManager {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this.sync = new Sync(db);
    this._db = db;
  }

  async start(full, force, serverLastSynced) {
    try {
      await this.sync.autoSync.start();
      await this.sync.start(full, force, serverLastSynced);
      return true;
    } catch (e) {
      var isHubException = e.message.includes("HubException:");
      if (isHubException) {
        var actualError = /HubException: (.*)/gm.exec(e.message);

        // NOTE: sometimes there's the case where the user has already
        // confirmed their email but the server still thinks that it
        // isn't confirmed. This check is added to trigger a force
        // update of the access token.
        if (
          actualError.includes("Please confirm your email ") &&
          (await this._db.user.getUser()).isEmailConfirmed
        ) {
          await this._db.user.tokenManager._refreshToken(true);
          return false;
        }

        if (actualError.length > 1) throw new Error(actualError[1]);
      }
      throw e;
    }
  }

  async acquireLock(callback) {
    try {
      this.sync.autoSync.stop();
      await callback();
    } finally {
      await this.sync.autoSync.start();
    }
  }

  async stop() {
    await this.sync.cancel();
  }
}

class Sync {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this.db = db;
    this.conflicts = new Conflicts(db);
    this.collector = new Collector(db);
    this.merger = new Merger(db);
    this.autoSync = new AutoSync(db, 1000);
    this.logger = logger.scope("Sync");
    this.syncConnectionMutex = new Mutex();
    this.itemTypeToCollection = {
      note: "notes",
      notebook: "notebooks",
      content: "content",
      attachment: "attachments",
      relation: "relations",
      reminder: "reminders",
      shortcut: "shortcuts"
    };
    let remoteSyncTimeout = 0;

    const tokenManager = new TokenManager(db.storage);
    this.connection = new signalr.HubConnectionBuilder()
      .withUrl(`${Constants.API_HOST}/hubs/sync`, {
        accessTokenFactory: () => tokenManager.getAccessToken(),
        skipNegotiation: true,
        transport: signalr.HttpTransportType.WebSockets,
        logger: {
          log(level, message) {
            const scopedLogger = logger.scope("SignalR::SyncHub");
            switch (level) {
              case signalr.LogLevel.Critical:
                return scopedLogger.fatal(new Error(message));
              case signalr.LogLevel.Error: {
                db.eventManager.publish(EVENTS.syncAborted, message);
                return scopedLogger.error(new Error(message));
              }
              case signalr.LogLevel.Warning:
                return scopedLogger.warn(message);
            }
          }
        }
      })
      .withHubProtocol(new MessagePackHubProtocol({ ignoreUndefined: true }))
      .build();
    this.connection.serverTimeoutInMilliseconds = 60 * 1000 * 5;
    EV.subscribe(EVENTS.userLoggedOut, async () => {
      await this.connection.stop();
      this.autoSync.stop();
    });

    let count = 0;
    this.connection.on("PushItems", async (chunk) => {
      if (this.connection.state !== signalr.HubConnectionState.Connected)
        return;

      clearTimeout(remoteSyncTimeout);
      remoteSyncTimeout = setTimeout(() => {
        this.db.eventManager.publish(EVENTS.syncAborted);
      }, 15000);

      const key = await this.db.user.getEncryptionKey();
      const dbLastSynced = await this.db.lastSynced();
      await this.processChunk(chunk, key, dbLastSynced, true);
    });

    this.connection.on("PushCompleted", (lastSynced) => {
      count = 0;
      clearTimeout(remoteSyncTimeout);
      this.onPushCompleted(lastSynced);
    });
  }

  /**
   *
   * @param {boolean} full
   * @param {boolean} force
   * @param {number} serverLastSynced
   */
  async start(full, force, serverLastSynced) {
    if (!(await checkSyncStatus(SYNC_CHECK_IDS.sync))) {
      await this.connection.stop();
      return;
    }
    if (!(await this.db.user.getUser())) return;

    this.logger.info("Starting sync", { full, force, serverLastSynced });

    this.connection.onclose((error) => {
      this.db.eventManager.publish(EVENTS.syncAborted);
      console.error(error);
      this.logger.error(error || new Error("Connection closed."));
      throw new Error("Connection closed.");
    });

    const { lastSynced, oldLastSynced } = await this.init(force);
    this.logger.info("Initialized sync", { lastSynced, oldLastSynced });

    const newLastSynced = Date.now();

    const serverResponse = full ? await this.fetch(lastSynced) : null;
    this.logger.info("Data fetched", serverResponse);

    if (await this.send(lastSynced, force, newLastSynced)) {
      this.logger.info("New data sent");
      await this.stop(newLastSynced);
    } else if (serverResponse) {
      this.logger.info("No new data to send.");
      await this.stop(serverResponse.lastSynced);
    } else {
      this.logger.info("Nothing to do.");
      await this.stop(serverLastSynced || oldLastSynced);
    }

    if (!(await checkSyncStatus(SYNC_CHECK_IDS.autoSync))) {
      await this.connection.stop();
    }
  }

  async init(isForceSync) {
    await this.checkConnection();

    await this.conflicts.recalculate();
    if (await this.conflicts.check()) {
      this.conflicts.throw();
    }

    let lastSynced = await this.db.lastSynced();
    if (isForceSync) lastSynced = 0;

    const oldLastSynced = lastSynced;
    return { lastSynced, oldLastSynced };
  }

  async fetch(lastSynced) {
    await this.checkConnection();

    const key = await this.db.user.getEncryptionKey();
    if (!key || !key.key || !key.salt) {
      EV.publish(EVENTS.userSessionExpired);
      throw new Error("User encryption key not generated. Please relogin.");
    }

    const dbLastSynced = await this.db.lastSynced();
    let count = 0;
    this.connection.off("SendItems");
    this.connection.on("SendItems", async (chunk) => {
      if (this.connection.state !== signalr.HubConnectionState.Connected)
        return;

      await this.processChunk(chunk, key, dbLastSynced);

      count += chunk.items.length;
      sendSyncProgressEvent(this.db.eventManager, `download`, count);

      return true;
    });
    const serverResponse = await this.connection.invoke(
      "RequestFetch",
      lastSynced
    );

    if (serverResponse.vaultKey) {
      await this.merger.mergeItem(
        "vaultKey",
        serverResponse.vaultKey,
        serverResponse.lastSynced
      );
    }

    this.connection.off("SendItems");

    if (await this.conflicts.check()) {
      this.conflicts.throw();
    }

    return { lastSynced: serverResponse.lastSynced };
  }

  async send(oldLastSynced, isForceSync, newLastSynced) {
    await this.uploadAttachments();

    let isSyncInitialized = false;
    let done = 0;
    for await (const item of this.collector.collect(
      100,
      oldLastSynced,
      isForceSync
    )) {
      if (!isSyncInitialized) {
        const vaultKey = await this.db.vault._getKey();
        newLastSynced = await this.connection.invoke("InitializePush", {
          vaultKey,
          lastSynced: newLastSynced
        });
        isSyncInitialized = true;
      }

      const result = await this.pushItem(item, newLastSynced);
      if (result) {
        done += item.items.length;
        sendSyncProgressEvent(this.db.eventManager, "upload", done);

        this.logger.info(`Batch sent (${done})`);
      } else {
        this.logger.error(
          new Error(`Failed to send batch. Server returned falsy response.`)
        );
      }
    }
    if (!isSyncInitialized) return;
    await this.connection.invoke("SyncCompleted", newLastSynced);
    return true;
  }

  async stop(lastSynced) {
    // refresh topic references
    this.db.notes.topicReferences.rebuild();
    // refresh monographs on sync completed
    await this.db.monographs.init();

    this.logger.info("Stopping sync", { lastSynced });
    const storedLastSynced = await this.db.lastSynced();
    if (lastSynced > storedLastSynced)
      await this.db.storage.write("lastSynced", lastSynced);
    this.db.eventManager.publish(EVENTS.syncCompleted);
  }

  async cancel() {
    this.logger.info("Sync canceled");
    await this.connection.stop();
  }

  /**
   * @private
   */
  async uploadAttachments() {
    const attachments = this.db.attachments.pending;
    this.logger.info("Uploading attachments...", { total: attachments.length });

    for (var i = 0; i < attachments.length; ++i) {
      const attachment = attachments[i];
      const { hash } = attachment.metadata;
      sendAttachmentsProgressEvent("upload", hash, attachments.length, i);

      try {
        const isUploaded = await this.db.fs.uploadFile(hash, hash);
        if (!isUploaded) throw new Error("Failed to upload file.");

        await this.db.attachments.markAsUploaded(attachment.id);
      } catch (e) {
        logger.error(e, { attachment });
        const error = e.message;
        await this.db.attachments.markAsFailed(attachment.id, error);
      }
    }
    sendAttachmentsProgressEvent("upload", null, attachments.length);
  }

  /**
   * @private
   */
  async onPushCompleted(lastSynced) {
    // refresh topic references
    this.db.notes.topicReferences.rebuild();

    this.db.eventManager.publish(
      EVENTS.databaseSyncRequested,
      false,
      false,
      lastSynced
    );

    // refresh monographs on sync completed
    await this.db.monographs.init();
  }

  async processChunk(chunk, key, dbLastSynced, notify = false) {
    const decrypted = await this.db.storage.decryptMulti(key, chunk.items);

    const deserialized = await Promise.all(
      decrypted.map((item, index) =>
        deserializeItem(item, chunk.items[index].v, this.db)
      )
    );

    let items = [];
    if (this.merger.isSyncCollection(chunk.type)) {
      items = deserialized.map((item) =>
        this.merger.mergeItemSync(item, chunk.type, dbLastSynced)
      );
    } else if (chunk.type === "content") {
      const localItems = await this.db.content.multi(
        chunk.items.map((i) => i.id)
      );
      items = await Promise.all(
        deserialized.map((item) =>
          this.merger.mergeContent(item, localItems[item.id], dbLastSynced)
        )
      );
    } else {
      items = await Promise.all(
        deserialized.map((item) =>
          this.merger.mergeItem(item, chunk.type, dbLastSynced)
        )
      );
    }

    if (
      notify &&
      (chunk.type === "content" || chunk.type === "note") &&
      items.length > 0
    ) {
      items.forEach((item) =>
        this.db.eventManager.publish(EVENTS.syncItemMerged, item)
      );
    }

    const collectionType = this.itemTypeToCollection[chunk.type];
    if (collectionType && this.db[collectionType]) {
      await this.db[collectionType]._collection.setItems(items);
    }
  }

  /**
   *
   * @param {SyncTransferItem} item
   * @returns {Promise<boolean>}
   * @private
   */
  async pushItem(item, newLastSynced) {
    await this.checkConnection();
    return (
      (await this.connection.invoke("PushItems", item, newLastSynced)) === 1
    );
  }

  async checkConnection() {
    await this.syncConnectionMutex.runExclusive(async () => {
      try {
        if (this.connection.state !== signalr.HubConnectionState.Connected) {
          if (
            this.connection.state !== signalr.HubConnectionState.Disconnected
          ) {
            await this.connection.stop();
          }

          await promiseTimeout(30000, this.connection.start());
        }
      } catch (e) {
        this.logger.warn(e.message);
        throw new Error(
          "Could not connect to the Sync server. Please try again."
        );
      }
    });
  }
}

function promiseTimeout(ms, promise) {
  // Create a promise that rejects in <ms> milliseconds
  let timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error("Sync timed out in " + ms + "ms."));
    }, ms);
  });
  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]);
}

async function deserializeItem(decryptedItem, version, database) {
  const deserialized = JSON.parse(decryptedItem);
  deserialized.remote = true;
  deserialized.synced = true;

  if (!deserialized.alg && !deserialized.cipher) {
    await migrateItem(
      deserialized,
      version,
      deserialized.type,
      database,
      "sync"
    );
  }
  return deserialized;
}

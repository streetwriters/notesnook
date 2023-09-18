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
  CURRENT_DATABASE_VERSION,
  EV,
  EVENTS,
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
import Database from "..";
import { migrateItem } from "../../migrations";
import { SerializedKey } from "@notesnook/crypto";
import {
  ItemMap,
  MaybeDeletedItem,
  Note,
  Notebook,
  TrashOrItem
} from "../../types";
import {
  MERGE_COLLECTIONS_MAP,
  SyncableItemType,
  SyncTransferItem
} from "./types";

export default class SyncManager {
  sync = new Sync(this.db);
  constructor(private readonly db: Database) {}

  async start(full?: boolean, force?: boolean, serverLastSynced?: number) {
    try {
      await this.sync.autoSync.start();
      await this.sync.start(full, force, serverLastSynced);
      return true;
    } catch (e) {
      const isHubException = (e as Error).message.includes("HubException:");
      if (isHubException) {
        var actualError = /HubException: (.*)/gm.exec((e as Error).message);
        const errorText =
          actualError && actualError.length > 1
            ? actualError[1]
            : (e as Error).message;

        // NOTE: sometimes there's the case where the user has already
        // confirmed their email but the server still thinks that it
        // isn't confirmed. This check is added to trigger a force
        // update of the access token.
        if (
          (errorText.includes("Please confirm your email ") ||
            errorText.includes("Invalid token.")) &&
          (await this.db.user.getUser())?.isEmailConfirmed
        ) {
          await this.db.tokenManager._refreshToken(true);
          return false;
        }

        throw new Error(errorText);
      }
      throw e;
    }
  }

  async acquireLock(callback: () => Promise<void>) {
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
  conflicts = new Conflicts(this.db);
  collector = new Collector(this.db);
  merger = new Merger(this.db);
  autoSync = new AutoSync(this.db, 1000);
  logger = logger.scope("Sync");
  syncConnectionMutex = new Mutex();
  connection: signalr.HubConnection;

  constructor(private readonly db: Database) {
    let remoteSyncTimeout = 0;

    const tokenManager = new TokenManager(db.storage);
    this.connection = new signalr.HubConnectionBuilder()
      .withUrl(`${Constants.API_HOST}/hubs/sync`, {
        accessTokenFactory: async () => {
          const token = await tokenManager.getAccessToken();
          if (!token) throw new Error("Failed to get access token.");
          return token;
        },
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

    this.connection.on("PushItems", async (chunk) => {
      if (this.connection.state !== signalr.HubConnectionState.Connected)
        return;

      clearTimeout(remoteSyncTimeout);
      remoteSyncTimeout = setTimeout(() => {
        this.db.eventManager.publish(EVENTS.syncAborted);
      }, 15000) as unknown as number;

      const key = await this.db.user.getEncryptionKey();
      if (!key || !key.key || !key.salt) {
        EV.publish(EVENTS.userSessionExpired);
        throw new Error("User encryption key not generated. Please relogin.");
      }

      const dbLastSynced = await this.db.lastSynced();
      await this.processChunk(chunk, key, dbLastSynced, true);
    });

    this.connection.on("PushCompleted", (lastSynced) => {
      clearTimeout(remoteSyncTimeout);
      this.onPushCompleted(lastSynced);
    });
  }

  async start(full?: boolean, force?: boolean, serverLastSynced?: number) {
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
    this.logger.info("Data fetched", serverResponse || {});

    if (await this.send(lastSynced, newLastSynced, force)) {
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

  async init(isForceSync?: boolean) {
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

  async fetch(lastSynced: number) {
    await this.checkConnection();

    const key = await this.db.user.getEncryptionKey();
    if (!key || !key.key || !key.salt) {
      this.logger.error(
        new Error("User encryption key not generated. Please relogin.")
      );
      EV.publish(EVENTS.userSessionExpired);
      return;
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

    if (
      serverResponse.vaultKey &&
      serverResponse.vaultKey.cipher !== null &&
      serverResponse.vaultKey.iv !== null &&
      serverResponse.vaultKey.salt !== null &&
      serverResponse.vaultKey.length > 0
    ) {
      await this.db.vault.setKey(serverResponse.vaultKey);
    }

    this.connection.off("SendItems");

    if (await this.conflicts.check()) {
      this.conflicts.throw();
    }

    return { lastSynced: serverResponse.lastSynced };
  }

  async send(oldLastSynced, isForceSync, newLastSynced) {
    return false;

    // await this.uploadAttachments();

    // let isSyncInitialized = false;
    // let done = 0;
    // for await (const item of this.collector.collect(
    //   100,
    //   oldLastSynced,
    //   isForceSync
    // )) {
    //   if (!isSyncInitialized) {
    //     const vaultKey = await this.db.vault._getKey();
    //     newLastSynced = await this.connection.invoke("InitializePush", {
    //       vaultKey,
    //       lastSynced: newLastSynced
    //     });
    //     isSyncInitialized = true;
    //   }

    //   const result = await this.pushItem(item, newLastSynced);
    //   if (result) {
    //     done += item.items.length;
    //     sendSyncProgressEvent(this.db.eventManager, "upload", done);

    //     this.logger.info(`Batch sent (${done})`);
    //   } else {
    //     this.logger.error(
    //       new Error(`Failed to send batch. Server returned falsy response.`)
    //     );
    //   }
    // }
    // if (!isSyncInitialized) return;
    // await this.connection.invoke("SyncCompleted", newLastSynced);
    // return true;
  }

  async stop(lastSynced: number) {
    // refresh monographs on sync completed
    await this.db.monographs.init();

    this.logger.info("Stopping sync", { lastSynced });
    const storedLastSynced = await this.db.lastSynced();
    if (lastSynced > storedLastSynced)
      await this.db.storage().write("lastSynced", lastSynced);
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

    await this.db.fs().queueUploads(
      attachments.map((a) => ({
        filename: a.metadata.hash,
        chunkSize: a.chunkSize,
        metadata: a.metadata
      })),
      "sync-uploads"
    );
  }

  /**
   * @private
   */
  async onPushCompleted(lastSynced: number) {
    this.db.eventManager.publish(
      EVENTS.databaseSyncRequested,
      false,
      false,
      lastSynced
    );

    // refresh monographs on sync completed
    await this.db.monographs.init();
  }

  async processChunk(
    chunk: SyncTransferItem,
    key: SerializedKey,
    dbLastSynced: number,
    notify = false
  ) {
    const itemType = chunk.type;
    if (itemType === "settings") return;

    const decrypted = await this.db.storage().decryptMulti(key, chunk.items);

    const deserialized = await Promise.all(
      decrypted.map((item, index) =>
        deserializeItem(item, chunk.items[index].v, this.db)
      )
    );

    let items: (
      | MaybeDeletedItem<
          ItemMap[SyncableItemType] | TrashOrItem<Note> | TrashOrItem<Notebook>
        >
      | undefined
    )[] = [];
    if (itemType === "content") {
      const localItems = await this.db.content.multi(
        chunk.items.map((i) => i.id)
      );
      items = await Promise.all(
        deserialized.map((item) =>
          this.merger.mergeContent(item, localItems[item.id], dbLastSynced)
        )
      );
    } else {
      items = this.merger.isSyncCollection(itemType)
        ? deserialized.map((item) =>
            this.merger.mergeItemSync(item, itemType, dbLastSynced)
          )
        : await Promise.all(
            deserialized.map((item) =>
              this.merger.mergeItem(item, itemType, dbLastSynced)
            )
          );
    }

    const collectionType = MERGE_COLLECTIONS_MAP[itemType];
    await this.db[collectionType].collection.setItems(items as any);

    if (
      notify &&
      (itemType === "note" || itemType === "content") &&
      items.length > 0
    ) {
      items.forEach((item) =>
        this.db.eventManager.publish(EVENTS.syncItemMerged, item)
      );
    }
  }

  private async pushItem(item: SyncTransferItem, newLastSynced: number) {
    await this.checkConnection();
    return (
      (await this.connection.invoke("PushItems", item, newLastSynced)) === 1
    );
  }

  private async checkConnection() {
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
        console.error(e);
        if (e instanceof Error) {
          this.logger.warn(e.message);
          throw new Error(
            "Could not connect to the Sync server. Please try again."
          );
        }
      }
    });
  }
}

function promiseTimeout(ms: number, promise: Promise<unknown>) {
  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error("Sync timed out in " + ms + "ms."));
    }, ms);
  });
  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]);
}

async function deserializeItem(
  decryptedItem: string,
  version: number,
  database: Database
) {
  const deserialized = JSON.parse(decryptedItem);
  deserialized.remote = true;
  deserialized.synced = true;

  if (!deserialized.alg && !deserialized.cipher) {
    await migrateItem(
      deserialized,
      version,
      CURRENT_DATABASE_VERSION,
      deserialized.type,
      database,
      "sync"
    );
  }
  return deserialized;
}

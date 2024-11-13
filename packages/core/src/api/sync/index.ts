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
} from "../../common.js";
import Constants from "../../utils/constants.js";
import TokenManager from "../token-manager.js";
import Collector from "./collector.js";
import { type HubConnection } from "@microsoft/signalr";
import Merger from "./merger.js";
import { AutoSync } from "./auto-sync.js";
import { logger } from "../../logger.js";
import { Mutex } from "async-mutex";
import Database from "../index.js";
import { migrateItem, migrateVaultKey } from "../../migrations.js";
import { SerializedKey } from "@notesnook/crypto";
import {
  Attachment,
  isDeleted,
  isTrashItem,
  Item,
  MaybeDeletedItem,
  Note,
  Notebook
} from "../../types.js";
import {
  SYNC_COLLECTIONS_MAP,
  SyncableItemType,
  SyncTransferItem
} from "./types.js";
import { DownloadableFile } from "../../database/fs.js";
import { SyncDevices } from "./devices.js";
import { DefaultColors } from "../../collections/colors.js";

enum LogLevel {
  /** Log level for very low severity diagnostic messages. */
  Trace = 0,
  /** Log level for low severity diagnostic messages. */
  Debug = 1,
  /** Log level for informational diagnostic messages. */
  Information = 2,
  /** Log level for diagnostic messages that indicate a non-fatal problem. */
  Warning = 3,
  /** Log level for diagnostic messages that indicate a failure in the current operation. */
  Error = 4,
  /** Log level for diagnostic messages that indicate a failure that will terminate the entire application. */
  Critical = 5,
  /** The highest possible log level. Used when configuring logging to indicate that no log messages should be emitted. */
  None = 6
}

enum HubConnectionState {
  /** The hub connection is disconnected. */
  Disconnected = "Disconnected",
  /** The hub connection is connecting. */
  Connecting = "Connecting",
  /** The hub connection is connected. */
  Connected = "Connected",
  /** The hub connection is disconnecting. */
  Disconnecting = "Disconnecting",
  /** The hub connection is reconnecting. */
  Reconnecting = "Reconnecting"
}

export type SyncOptions = {
  type: "full" | "fetch" | "send";
  force?: boolean;
  offlineMode?: boolean;
};

export default class SyncManager {
  sync;
  devices;
  constructor(private readonly db: Database) {
    this.sync = new Sync(db);
    this.devices = this.sync.devices;
  }

  async start(options: SyncOptions) {
    try {
      if (await checkSyncStatus(SYNC_CHECK_IDS.autoSync))
        await this.sync.autoSync.start();
      await this.sync.start(options);
      return true;
    } catch (e) {
      const isHubException = (e as Error).message.includes("HubException:");
      if (isHubException) {
        const actualError = /HubException: (.*)/gm.exec((e as Error).message);
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
  collector;
  merger;
  autoSync;
  logger = logger.scope("Sync");
  syncConnectionMutex = new Mutex();
  connection?: HubConnection;
  devices;
  private conflictedNoteIds: string[] = [];
  private uncachedAttachments: DownloadableFile[] = [];

  constructor(private readonly db: Database) {
    this.collector = new Collector(db);
    this.merger = new Merger(db);
    this.autoSync = new AutoSync(db, 1000);
    this.devices = new SyncDevices(db.kv, db.tokenManager);

    EV.subscribe(EVENTS.userLoggedOut, async () => {
      await this.connection?.stop();
      this.autoSync.stop();
    });
  }

  async start(options: SyncOptions) {
    await this.createConnection(options);
    if (!this.connection) return;

    if (!(await checkSyncStatus(SYNC_CHECK_IDS.sync))) {
      await this.connection.stop();
      return;
    }
    if (!(await this.db.user.getUser())) return;

    this.logger.info("Starting sync", options);

    this.connection.onclose((error = new Error("Connection closed.")) => {
      this.db.eventManager.publish(EVENTS.syncAborted);
      this.logger.error(error);
      throw new Error("Connection closed.");
    });

    const { deviceId } = await this.init(options.force);
    this.logger.info("Initialized sync", { deviceId });

    if (options.type === "fetch" || options.type === "full") {
      await this.fetch(deviceId, options);
      this.logger.info("Data fetched");
    }

    if (
      (options.type === "send" || options.type === "full") &&
      (await this.send(deviceId, options.force))
    )
      this.logger.info("New data sent");

    await this.stop(options);

    if (!(await checkSyncStatus(SYNC_CHECK_IDS.autoSync))) {
      await this.connection.stop();
      this.autoSync.stop();
    }
  }

  async init(isForceSync?: boolean) {
    await this.checkConnection();

    if (isForceSync) {
      await this.devices.unregister();
      await this.devices.register();
    }

    let deviceId = await this.devices.get();
    if (!deviceId) {
      await this.devices.register();
      deviceId = await this.devices.get();
    }

    if (!deviceId) throw new Error("Sync device not registered.");

    return { deviceId };
  }

  async fetch(deviceId: string, options: SyncOptions) {
    await this.checkConnection();

    await this.connection?.invoke("RequestFetch", deviceId);

    if (this.conflictedNoteIds.length > 0) {
      await this.db
        .sql()
        .updateTable("notes")
        .where("id", "in", this.conflictedNoteIds)
        .set({ conflicted: true })
        .execute();
      this.conflictedNoteIds = [];
    }

    if (this.uncachedAttachments.length > 0 && options.offlineMode) {
      await this.db
        .fs()
        .queueDownloads(this.uncachedAttachments, "offline-mode", {
          readOnDownload: false
        });
      this.uncachedAttachments = [];
    }
  }

  async send(deviceId: string, isForceSync?: boolean) {
    await this.uploadAttachments();

    let done = 0;
    for await (const item of this.collector.collect(100, isForceSync)) {
      const result = await this.pushItem(deviceId, item);
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
    if (done > 0) await this.connection?.send("PushCompleted");
    return true;
  }

  async stop(options: SyncOptions) {
    if (
      (options.type === "send" || options.type === "full") &&
      (await this.collector.hasUnsyncedChanges())
    ) {
      this.logger.info("Changes made during last sync. Syncing again...");
      await this.start({ type: "send" });
      return;
    }
    // refresh monographs
    await this.db.monographs.refresh().catch(this.logger.error);
    // update trash cache
    await this.db.trash.buildCache();

    this.logger.info("Stopping sync");
    await this.db.setLastSynced(Date.now());
    this.db.eventManager.publish(EVENTS.syncCompleted);
  }

  async cancel() {
    this.logger.info("Sync canceled");
    await this.connection?.stop();
  }

  /**
   * @private
   */
  async uploadAttachments() {
    const attachments = await this.db.attachments.pending.items();
    this.logger.info("Uploading attachments...", { total: attachments.length });

    await this.db.fs().queueUploads(
      attachments.map<DownloadableFile>((a) => ({
        filename: a.hash,
        chunkSize: a.chunkSize
      })),
      "sync-uploads"
    );
  }

  /**
   * @private
   */
  async onPushCompleted() {
    this.db.eventManager.publish(EVENTS.databaseSyncRequested, true, false);
  }

  async processChunk(
    chunk: SyncTransferItem,
    key: SerializedKey,
    options: SyncOptions
  ) {
    const itemType = chunk.type;
    const decrypted = await this.db.storage().decryptMulti(key, chunk.items);

    const deserialized: MaybeDeletedItem<Item>[] = [];
    for (let i = 0; i < decrypted.length; ++i) {
      const decryptedItem = decrypted[i];
      const version = chunk.items[i].v;
      const item = await deserializeItem(
        decryptedItem,
        itemType,
        version,
        this.db
      );
      if (item) deserialized.push(item);
    }

    const collectionType = SYNC_COLLECTIONS_MAP[itemType];
    const collection = this.db[collectionType].collection;
    const localItems = await collection.records(chunk.items.map((i) => i.id));
    let items: (MaybeDeletedItem<Item> | undefined)[] = [];
    if (itemType === "content") {
      items = deserialized.map((item) =>
        this.merger.mergeContent(item, localItems[item.id])
      );
    } else {
      items =
        itemType === "attachment"
          ? await Promise.all(
              deserialized.map((item) =>
                this.merger.mergeAttachment(
                  item as MaybeDeletedItem<Attachment>,
                  localItems[item.id] as MaybeDeletedItem<Attachment>
                )
              )
            )
          : deserialized.map((item) =>
              this.merger.mergeItem(item, localItems[item.id])
            );
    }

    if (itemType === "note" || itemType === "content") {
      items.forEach((item) =>
        this.db.eventManager.publish(EVENTS.syncItemMerged, item)
      );

      for (const item of items)
        if (!item?.deleted && item?.type === "tiptap" && !!item.conflicted)
          this.conflictedNoteIds.push(item.noteId);
    }

    if (itemType === "attachment" && options.offlineMode)
      for (const item of items)
        if (!item?.deleted && item?.type === "attachment")
          this.uncachedAttachments.push({
            filename: item.hash,
            chunkSize: item.chunkSize
          });

    await collection.put(items as any);
  }

  private async pushItem(deviceId: string, item: SyncTransferItem) {
    await this.checkConnection();
    return (await this.connection?.invoke("PushItems", deviceId, item)) === 1;
  }

  private async createConnection(options: SyncOptions) {
    if (this.connection) return;

    const { HubConnectionBuilder, HttpTransportType, JsonHubProtocol } =
      await import("@microsoft/signalr");

    const tokenManager = new TokenManager(this.db.kv);
    this.connection = new HubConnectionBuilder()
      .withUrl(`${Constants.API_HOST}/hubs/sync/v2`, {
        accessTokenFactory: async () => {
          const token = await tokenManager.getAccessToken();
          if (!token) throw new Error("Failed to get access token.");
          return token;
        },
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
        logger: {
          log: (level, message) => {
            const scopedLogger = logger.scope("SignalR::SyncHub");
            switch (level) {
              case LogLevel.Critical:
                return scopedLogger.fatal(new Error(message));
              case LogLevel.Error: {
                this.db.eventManager.publish(EVENTS.syncAborted, message);
                return scopedLogger.error(new Error(message));
              }
              case LogLevel.Warning:
                return scopedLogger.warn(message);
            }
          }
        }
      })
      .withHubProtocol(new JsonHubProtocol())
      .build();
    this.connection.serverTimeoutInMilliseconds = 60 * 1000 * 5;
    this.connection.on("PushCompleted", () => this.onPushCompleted());
    this.connection.on("SendVaultKey", async (vaultKey) => {
      if (this.connection?.state !== HubConnectionState.Connected) return false;

      if (
        vaultKey &&
        vaultKey.cipher !== null &&
        vaultKey.iv !== null &&
        vaultKey.salt !== null &&
        vaultKey.length > 0
      ) {
        const vault = await this.db.vaults.default();
        if (!vault)
          await migrateVaultKey(
            this.db,
            vaultKey,
            5.9,
            CURRENT_DATABASE_VERSION
          );
      }

      return true;
    });

    this.connection.on("SendItems", async (chunk) => {
      if (this.connection?.state !== HubConnectionState.Connected) return false;

      const key = await this.getKey();
      if (!key) return false;

      await this.processChunk(chunk, key, options);

      sendSyncProgressEvent(this.db.eventManager, `download`, chunk.count);

      return true;
    });
  }

  private async getKey() {
    const key = await this.db.user.getEncryptionKey();
    if (!key || !key || !key) {
      this.logger.error(
        new Error("User encryption key not generated. Please relogin.")
      );
      EV.publish(EVENTS.userSessionExpired);
      return;
    }
    return key;
  }

  private async checkConnection() {
    await this.syncConnectionMutex.runExclusive(async () => {
      try {
        if (
          this.connection &&
          this.connection.state !== HubConnectionState.Connected
        ) {
          if (this.connection.state !== HubConnectionState.Disconnected) {
            await this.connection.stop();
          }

          await promiseTimeout(30000, this.connection.start());
        }
      } catch (e) {
        this.logger.error(e, "Could not connect to the Sync server.");
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
  type: SyncableItemType,
  version: number,
  database: Database
): Promise<MaybeDeletedItem<Item> | undefined> {
  const item = JSON.parse(decryptedItem) as MaybeDeletedItem<Item>;
  item.remote = true;
  item.synced = true;

  let migrationResult = await migrateItem(
    item,
    version,
    CURRENT_DATABASE_VERSION,
    isDeleted(item) ? type : item.type,
    database,
    "sync"
  );
  if (migrationResult === "skip") return;

  // since items in trash can have their own set of migrations,
  // we have to run the migration again to account for that.
  if (isTrashItem(item)) {
    migrationResult = await migrateItem(
      item as unknown as Note | Notebook,
      version,
      CURRENT_DATABASE_VERSION,
      item.itemType,
      database,
      "sync"
    );
    if (migrationResult === "skip") return;
  }

  const itemType = isDeleted(item)
    ? type
    : // colors are naively of type "tag" instead of "color" so we have to fix that.
    item.type === "tag" && DefaultColors[item.title.toLowerCase()]
    ? "color"
    : item.type === "trash" && "itemType" in item && item.itemType
    ? item.itemType
    : item.type;

  if (!itemType || itemType === "topic" || itemType === "settings") return;

  if (migrationResult) item.synced = false;

  return item;
}

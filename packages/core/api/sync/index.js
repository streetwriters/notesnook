import {
  EV,
  EVENTS,
  sendAttachmentsProgressEvent,
  sendSyncProgressEvent,
} from "../../common";
import Constants from "../../utils/constants";
import TokenManager from "../token-manager";
import Collector from "./collector";
import * as signalr from "@microsoft/signalr";
import Merger from "./merger";
import Conflicts from "./conflicts";
import { AutoSync } from "./auto-sync";
import { toChunks } from "../../utils/array";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { logger } from "../../logger";

/**
 * @typedef {{
 *  item: string,
 *  itemType: string,
 *  lastSynced: number,
 *  current: number,
 *  total: number,
 *  synced?: boolean
 * }} SyncTransferItem
 */

/**
 * @typedef {{
 *  items:  string[],
 *  types: string[],
 *  lastSynced: number,
 *  current: number,
 *  total: number,
 * }} BatchedSyncTransferItem
 */

export default class SyncManager {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this.sync = new Sync(db);
    this.isSyncing = false;
  }

  async start(full, force) {
    if (this.isSyncing) return false;

    try {
      this.isSyncing = true;

      await this.sync.autoSync.start();
      await this.sync.start(full, force);
      return true;
    } catch (e) {
      var isHubException = e.message.includes("HubException:");
      if (isHubException) {
        var actualError = /HubException: (.*)/gm.exec(e.message);
        if (actualError.length > 1) throw new Error(actualError[1]);
      }
      throw e;
    } finally {
      this.isSyncing = false;
    }
  }

  async acquireLock(callback) {
    try {
      this.isSyncing = true;

      this.sync.autoSync.stop();
      await callback();
      await this.sync.autoSync.start();
    } finally {
      this.isSyncing = false;
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
              case signalr.LogLevel.Debug:
                return scopedLogger.debug(message);
              case signalr.LogLevel.Error:
                return scopedLogger.error(new Error(message));
              case signalr.LogLevel.Information:
                return scopedLogger.info(message);
              case signalr.LogLevel.None:
                return scopedLogger.log(message);
              case signalr.LogLevel.Trace:
                return scopedLogger.log(message);
              case signalr.LogLevel.Warning:
                return scopedLogger.warn(message);
            }
          },
        },
      })
      .withHubProtocol(new MessagePackHubProtocol({ ignoreUndefined: true }))
      .withAutomaticReconnect()
      .build();

    EV.subscribe(EVENTS.userLoggedOut, async () => {
      await this.connection.stop();
      this.autoSync.stop();
    });

    this.connection.on("SyncItem", async (syncStatus) => {
      await this.onSyncItem(syncStatus);
      sendSyncProgressEvent(
        this.db.eventManager,
        "download",
        syncStatus.total,
        syncStatus.current
      );
    });

    this.connection.on("RemoteSyncCompleted", (lastSynced) => {
      this.onRemoteSyncCompleted(lastSynced);
    });
  }

  /**
   *
   * @param {boolean} full
   * @param {boolean} force
   * @param {number} serverLastSynced
   */
  async start(full, force, serverLastSynced) {
    this.logger.info("Starting sync", { full, force, serverLastSynced });

    this.connection.onclose((error) => {
      this.logger.error(error || new Error("Connection closed."));
      throw new Error("Connection closed.");
    });

    const { lastSynced, oldLastSynced } = await this.init(force);
    this.logger.info("Initialized sync", { lastSynced, oldLastSynced });

    const { newLastSynced, data } = await this.collect(lastSynced, force);
    this.logger.info("Data collected for sync", {
      newLastSynced,
      length: data.items.length,
      isEmpty: data.items.length <= 0,
    });

    const serverResponse = full ? await this.fetch(lastSynced) : null;
    this.logger.info("Data fetched", serverResponse);

    if (await this.send(data, newLastSynced)) {
      this.logger.info("New data sent");
      await this.stop(newLastSynced);
    } else if (serverResponse) {
      this.logger.info("No new data to send.");
      await this.stop(serverResponse.lastSynced);
    } else {
      this.logger.info("Nothing to do.");
      await this.stop(serverLastSynced || oldLastSynced);
    }
  }

  async init(isForceSync) {
    await this.checkConnection();

    await this.conflicts.recalculate();
    if (await this.conflicts.check()) {
      throw new Error(
        "Merge conflicts detected. Please resolve all conflicts to continue syncing."
      );
    }

    let lastSynced = await this.db.lastSynced();
    if (isForceSync) lastSynced = 0;

    const oldLastSynced = lastSynced;
    return { lastSynced, oldLastSynced };
  }

  async fetch(lastSynced) {
    await this.checkConnection();

    const serverResponse = await new Promise((resolve, reject) => {
      let counter = { count: 0, queue: null };
      this.connection.stream("FetchItems", lastSynced).subscribe({
        next: (/** @type {SyncTransferItem} */ syncStatus) => {
          const { total, item, synced, lastSynced } = syncStatus;
          if (synced) {
            resolve({ synced, lastSynced });
            return;
          }
          if (!item) return;
          if (counter.queue === null) counter.queue = total;

          this.onSyncItem(syncStatus)
            .then(() => {
              sendSyncProgressEvent(
                this.db.eventManager,
                `download`,
                total,
                ++counter.count
              );
            })
            .catch(reject)
            .finally(() => {
              if (--counter.queue <= 0) resolve({ synced, lastSynced });
            });
        },
        complete: () => {},
        error: reject,
      });
    });

    if (await this.conflicts.check()) {
      throw new Error(
        "Merge conflicts detected. Please resolve all conflicts to continue syncing."
      );
    }

    return serverResponse;
  }

  async collect(lastSynced, force) {
    const newLastSynced = Date.now();
    const data = await this.collector.collect(lastSynced, force);
    return { newLastSynced, data };
  }

  /**
   *
   * @param {{ items: any[]; vaultKey: any; }} data
   * @param {number} lastSynced
   * @returns {Promise<boolean>}
   */
  async send(data, lastSynced) {
    await this.uploadAttachments();

    if (data.items.length <= 0) return false;

    const arrays = data.items.reduce(
      (arrays, item) => {
        arrays.types.push(item.type);
        arrays.items.push(item);
        return arrays;
      },
      { items: [], types: [] }
    );

    if (data.vaultKey) {
      arrays.types.push("vaultKey");
      arrays.items.push(data.vaultKey);
    }

    let total = arrays.items.length;

    arrays.types = toChunks(arrays.types, 30);
    arrays.items = toChunks(arrays.items, 30);

    let done = 0;
    for (let i = 0; i < arrays.items.length; ++i) {
      this.logger.info(`Sending batch ${done}/${total}`);

      const items = (await this.collector.encrypt(arrays.items[i])).map(
        (item) => JSON.stringify(item)
      );
      const types = arrays.types[i];

      const result = await this.sendBatchToServer({
        lastSynced,
        current: i,
        total,
        items,
        types,
      });

      if (result) {
        done += items.length;
        sendSyncProgressEvent(this.db.eventManager, "upload", total, done);

        this.logger.info(`Batch sent (${done}/${total})`);
      } else {
        this.logger.error(
          new Error(`Failed to send batch. Server returned falsy response.`)
        );
      }
    }
    return await this.connection.invoke("SyncCompleted", lastSynced);
  }

  async stop(lastSynced) {
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
  async onRemoteSyncCompleted(lastSynced) {
    await this.start(false, false, lastSynced);
  }

  /**
   * @param {SyncTransferItem} syncStatus
   * @private
   */
  onSyncItem(syncStatus) {
    const { item: itemJSON, itemType } = syncStatus;
    const item = JSON.parse(itemJSON);

    return this.merger.mergeItem(itemType, item);
  }

  /**
   *
   * @param {BatchedSyncTransferItem} batch
   * @returns {Promise<boolean>}
   * @private
   */
  async sendBatchToServer(batch) {
    if (!batch) return false;
    await this.checkConnection();

    const result = await this.connection.invoke("SyncItem", batch);
    return result === 1;
  }

  async checkConnection() {
    if (this.connection.state !== signalr.HubConnectionState.Connected)
      await this.connection.start();
  }
}

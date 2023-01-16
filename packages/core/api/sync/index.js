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
import { toChunks } from "../../utils/array";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { logger } from "../../logger";
import { Mutex } from "async-mutex";

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
  }

  async start(full, force) {
    try {
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
              case signalr.LogLevel.Debug:
                return scopedLogger.debug(message);
              case signalr.LogLevel.Error: {
                db.eventManager.publish(EVENTS.syncAborted, message);
                return scopedLogger.error(new Error(message));
              }
              case signalr.LogLevel.Information:
                return scopedLogger.info(message);
              case signalr.LogLevel.None:
                return scopedLogger.log(message);
              case signalr.LogLevel.Trace:
                return scopedLogger.log(message);
              case signalr.LogLevel.Warning:
                return scopedLogger.warn(message);
            }
          }
        }
      })
      .withHubProtocol(new MessagePackHubProtocol({ ignoreUndefined: true }))
      .build();

    EV.subscribe(EVENTS.userLoggedOut, async () => {
      await this.connection.stop();
      this.autoSync.stop();
    });

    this.connection.on("SyncItem", async (payload) => {
      clearTimeout(remoteSyncTimeout);
      remoteSyncTimeout = setTimeout(() => {
        db.eventManager.publish(EVENTS.syncAborted);
      }, 15000);

      await this.onSyncItem(payload);
      sendSyncProgressEvent(
        this.db.eventManager,
        "download",
        payload.total,
        payload.current
      );
    });

    this.connection.on("RemoteSyncCompleted", (lastSynced) => {
      clearTimeout(remoteSyncTimeout);
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
    if (!(await checkSyncStatus(SYNC_CHECK_IDS.sync))) {
      await this.connection.stop();
      return;
    }

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
      isEmpty: data.items.length <= 0
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
        error: reject
      });
    });

    if (await this.conflicts.check()) {
      this.conflicts.throw();
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
   * @param {{ items: any[]; vaultKey: any; types: string[]; }} data
   * @param {number} lastSynced
   * @returns {Promise<boolean>}
   */
  async send(data, lastSynced) {
    await this.uploadAttachments();

    if (data.types.length === 1 && data.types[0] === "vaultKey") return false;
    if (data.items.length <= 0) return false;

    let total = data.items.length;

    const types = toChunks(data.types, 30);
    const items = toChunks(data.items, 30);

    let done = 0;
    for (let i = 0; i < items.length; ++i) {
      this.logger.info(`Sending batch ${done}/${total}`);

      const encryptedItems = (await this.collector.encrypt(items[i])).map(
        (item) => JSON.stringify(item)
      );

      const result = await this.sendBatchToServer({
        lastSynced,
        current: i,
        total,
        items: encryptedItems,
        types: types[i]
      });

      if (result) {
        done += encryptedItems.length;
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
    // refresh monographs on sync completed
    await this.db.monographs.init();
    // refresh topic references
    this.db.notes.topicReferences.rebuild();

    await this.start(false, false, lastSynced);
  }

  /**
   * @param {SyncTransferItem} syncStatus
   * @private
   */
  async onSyncItem(syncStatus) {
    const { item: itemJSON, itemType } = syncStatus;
    const item = JSON.parse(itemJSON);

    const remoteItem = await this.merger.mergeItem(itemType, item);
    if (remoteItem)
      this.db.eventManager.publish(EVENTS.syncItemMerged, remoteItem);
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

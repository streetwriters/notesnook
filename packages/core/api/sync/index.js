/**
 * GENERAL PROCESS:
 * make a get request to server with current lastSynced
 * parse the response. the response should contain everything that user has on the server
 * decrypt the response
 * merge everything into the database and look for conflicts
 * send the conflicts (if any) to the end-user for resolution
 * once the conflicts have been resolved, send the updated data back to the server
 */

/**
 * MERGING:
 * Locally, get everything that was editted/added after the lastSynced
 * Run forEach loop on the server response.
 * Add items that do not exist in the local collections
 * Remove items (without asking) that need to be removed
 * Update items that were editted before the lastSynced
 * Try to merge items that were edited after the lastSynced
 * Items in which the content has changed, send them for conflict resolution
 * Otherwise, keep the most recently updated copy.
 */

/**
 * CONFLICTS:
 * Syncing should pause until all the conflicts have been resolved
 * And then it should continue.
 */
import {
  checkIsUserPremium,
  CHECK_IDS,
  EV,
  EVENTS,
  sendAttachmentsProgressEvent,
  sendSyncProgressEvent,
} from "../../common";
import Constants from "../../utils/constants";
import http from "../../utils/http";
import TokenManager from "../token-manager";
import Collector from "./collector";
import Merger from "./merger";
import { areAllEmpty } from "./utils";
import { Mutex, withTimeout } from "async-mutex";
import * as signalr from "@microsoft/signalr";
import RealtimeMerger from "./realtimeMerger";
import set from "../../utils/set";

const ITEM_TYPE_MAP = {
  attachments: "attachment",
  content: "content",
  notes: "note",
  notebooks: "notebooks",
  settings: "settings",
};

export default class Sync {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this._db = db;
    this._collector = new Collector(this._db);
    this._merger = new Merger(this._db);
    this._realtimeMerger = new RealtimeMerger(this._db);
    this.syncMutex = new Mutex();
    this._tokenManager = new TokenManager(this._db.storage);
    this._autoSyncTimeout = 0;
    this._autoSyncInterval = 100;
    this._queue = new SyncQueue(this._db.storage);
    this._connection = new signalr.HubConnectionBuilder()
      .withUrl(`${Constants.API_HOST}/hubs/sync`, {
        accessTokenFactory: () => this._db.user.tokenManager.getAccessToken(),
      })
      .build();

    this._connection.on("SyncItem", async (type, item, current, total) => {
      this.stopAutoSync();
      await this._realtimeMerger.mergeItem(type, JSON.parse(item));
      EV.publish(EVENTS.appRefreshRequested);
      sendSyncProgressEvent("download", total, current);
      await this.startAutoSync();
    });
  }

  async start(full, force) {
    if (this.syncMutex.isLocked()) return false;

    return this.syncMutex
      .runExclusive(() => {
        this.stopAutoSync();
        return this._realTimeSync(full, force);
      })
      .finally(() => this._afterSync());
  }

  // async remoteSync() {
  //   if (this.syncMutex.isLocked()) {
  //     this.hasNewChanges = true;
  //     return;
  //   }
  //   await this.syncMutex
  //     .runExclusive(async () => {
  //       this.stopAutoSync();
  //       this.hasNewChanges = false;
  //       if (await this._realTimeSync(true, false))
  //         EV.publish(EVENTS.appRefreshRequested);
  //     })
  //     .finally(() => this._afterSync());
  // }

  async startAutoSync() {
    if (!(await checkIsUserPremium(CHECK_IDS.databaseSync))) return;
    this.databaseUpdatedEvent = EV.subscribe(
      EVENTS.databaseUpdated,
      this._scheduleSync.bind(this)
    );
  }

  stopAutoSync() {
    clearTimeout(this._autoSyncTimeout);
    if (this.databaseUpdatedEvent) this.databaseUpdatedEvent.unsubscribe();
  }

  async acquireLock(callback) {
    this.stopAutoSync();
    await this.syncMutex.runExclusive(callback);
    await this.startAutoSync();
  }

  async _realTimeSync(full, force) {
    if (this._connection.state !== signalr.HubConnectionState.Connected)
      await this._connection.start();

    let { lastSynced } = await this._performChecks();
    const oldLastSynced = lastSynced;
    if (force) lastSynced = 0;

    let { syncedAt } = await this._queue.get();

    if (full && !syncedAt) {
      await this._connection.send("FetchItems", lastSynced);
      var serverResponse = await new Promise((resolve) => {
        this._connection.on("SyncCompleted", (synced, lastSynced) =>
          resolve({ synced, lastSynced })
        );
      });

      await this._db.conflicts.check();
    }

    await this._uploadAttachments();

    const data = await this._collector.collect(lastSynced);
    console.log(data, syncedAt, lastSynced);
    if (syncedAt) {
      const newData = this._collector.filter(
        data,
        (item) => item.dateModified > syncedAt
      );
      lastSynced = Date.now();
      await this._queue.merge(newData, lastSynced);
    } else {
      lastSynced = Date.now();
      await this._queue.new(data, lastSynced);
    }

    if (!areAllEmpty(data)) {
      const { itemIds } = await this._queue.get();
      const total = itemIds.length;
      for (let i = 0; i < total; ++i) {
        const id = itemIds[i];
        const [arrayKey, itemId] = id.split(":");

        const array = data[arrayKey] || [];
        const item = array.find((item) => item.id === itemId);
        const type = ITEM_TYPE_MAP[arrayKey];
        if (!item) {
          continue;
        }

        if (await this.sendItemToServer(type, item, lastSynced)) {
          await this._queue.dequeue(id);
          sendSyncProgressEvent("upload", total, i + 1);
        }
      }
      if (data.vaultKey)
        await this.sendItemToServer("vaultKey", data.vaultKey, lastSynced);

      if (!(await this._connection.invoke("SyncCompleted", lastSynced)))
        lastSynced = oldLastSynced;
    } else if (serverResponse) lastSynced = serverResponse.lastSynced;
    else lastSynced = oldLastSynced;

    await this._db.storage.write("lastSynced", lastSynced);
    return true;
  }

  async _afterSync() {
    if (!this.hasNewChanges) {
      this.startAutoSync();
    } else {
      return this.remoteSync();
    }
  }

  _scheduleSync() {
    this.stopAutoSync();
    this._autoSyncTimeout = setTimeout(() => {
      EV.publish(EVENTS.databaseSyncRequested, false, false);
    }, this._autoSyncInterval);
  }

  async _send(data) {
    let token = await this._tokenManager.getAccessToken();
    let response = await http.post.json(
      `${Constants.API_HOST}/sync`,
      data,
      token
    );
    return response.lastSynced;
  }

  async _mergeAttachments(lastSynced) {
    let token = await this._tokenManager.getAccessToken();
    var serverResponse = await this._fetchAttachments(lastSynced, token);
    await this._merger.merge(serverResponse, lastSynced);
  }

  async _uploadAttachments() {
    const attachments = this._db.attachments.pending;
    for (var i = 0; i < attachments.length; ++i) {
      const attachment = attachments[i];
      const { hash } = attachment.metadata;
      sendAttachmentsProgressEvent("upload", hash, attachments.length, i);

      try {
        const isUploaded = await this._db.fs.uploadFile(hash, hash);
        if (!isUploaded) throw new Error("Failed to upload file.");

        await this._db.attachments.markAsUploaded(attachment.id);
      } catch (e) {
        console.error(e, attachment);
        const error = e.message;
        await this._db.attachments.markAsFailed(attachment.id, error);
      }
    }
    sendAttachmentsProgressEvent("upload", null, attachments.length);
  }

  async _performChecks() {
    let lastSynced = (await this._db.lastSynced()) || 0;

    // update the conflicts status and if find any, throw
    await this._db.conflicts.recalculate();
    await this._db.conflicts.check();

    return { lastSynced };
  }

  async _fetch(lastSynced) {
    let token = await this._tokenManager.getAccessToken();
    return await http.get(
      `${Constants.API_HOST}/sync?lst=${lastSynced}`,
      token
    );
  }

  async _fetchAttachments(lastSynced) {
    let token = await this._tokenManager.getAccessToken();
    return await http.get(
      `${Constants.API_HOST}/sync/attachments?lst=${lastSynced}`,
      token
    );
  }

  async sendItemToServer(type, item, dateSynced) {
    if (!item) return;
    const result = await this._connection.invoke(
      "SyncItem",
      type,
      JSON.stringify(item),
      dateSynced
    );
    return result === 1;
  }
}

function mapToIds(data) {
  const ids = [];
  const keys = ["attachments", "content", "notes", "notebooks", "settings"];
  for (let key of keys) {
    const array = data[key];
    if (!array || !Array.isArray(array)) continue;

    for (let item of array) {
      ids.push(`${key}:${item.id}`);
    }
  }
  return ids;
}

class SyncQueue {
  /**
   *
   * @param {import("../../database/storage").default} storage
   */
  constructor(storage) {
    this.storage = storage;
  }

  async new(data, syncedAt) {
    const itemIds = mapToIds(data);
    const syncData = { itemIds, syncedAt };
    await this.save(syncData);
    return syncData;
  }

  async merge(data, syncedAt) {
    const syncQueue = await this.get();
    if (!syncQueue.itemIds) return;

    const itemIds = set.union(syncQueue.itemIds, mapToIds(data));
    const syncData = { itemIds, syncedAt };
    await this.save(syncData);
    return syncData;
  }

  async dequeue(id) {
    const syncQueue = await this.get();
    if (!syncQueue || !syncQueue.itemIds) return;
    const { itemIds } = syncQueue;
    const index = itemIds.findIndex((i) => i === id);
    if (index <= -1) return;
    syncQueue.itemIds.splice(index, 1);
    await this.save(syncQueue);
  }

  /**
   *
   * @returns {Promise<{ itemIds: string[]; syncedAt: number; }>}
   */
  async get() {
    const syncQueue = await this.storage.read("syncQueue");
    if (!syncQueue || syncQueue.itemIds.length <= 0) return {};
    return syncQueue;
  }

  async save(syncQueue) {
    await this.storage.write("syncQueue", syncQueue);
  }
}

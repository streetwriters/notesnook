import {
  EV,
  EVENTS,
  sendAttachmentsProgressEvent,
  sendSyncProgressEvent,
} from "../../common";
import Constants from "../../utils/constants";
import TokenManager from "../token-manager";
import Collector from "./collector";
import { areAllEmpty } from "./utils";
import { Mutex } from "async-mutex";
import * as signalr from "@microsoft/signalr";
import Merger from "./merger";
import Conflicts from "./conflicts";
import { SyncQueue } from "./syncqueue";
import { AutoSync } from "./auto-sync";
import { toChunks } from "../../utils/array";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";

const ITEM_TYPE_MAP = {
  attachments: "attachment",
  content: "content",
  notes: "note",
  notebooks: "notebook",
  settings: "settings",
};

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
    this.syncMutex = new Mutex();
  }

  async start(full, force) {
    if (this.syncMutex.isLocked()) return false;
    return this.syncMutex.runExclusive(async () => {
      await this.sync.autoSync.start();
      await this.sync.start(full, force);
    });
  }

  async acquireLock(callback) {
    this.sync.autoSync.stop();
    await this.syncMutex.runExclusive(callback);
    await this.sync.autoSync.start();
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
    this.queue = new SyncQueue(db.storage);
    this.merger = new Merger(db);
    this.autoSync = new AutoSync(db, 1000);

    const tokenManager = new TokenManager(db.storage);
    this.connection = new signalr.HubConnectionBuilder()
      .withUrl(`${Constants.API_HOST}/hubs/sync`, {
        accessTokenFactory: () => tokenManager.getAccessToken(),
      })
      .withHubProtocol(new MessagePackHubProtocol({ ignoreUndefined: true }))
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
   * @param {Object} ignoredIds
   */
  async start(full, force, serverLastSynced) {
    this.connection.onclose(() => {
      throw new Error("Connection closed.");
    });

    const { lastSynced, oldLastSynced } = await this.init(force);

    const { newLastSynced, data } = await this.collect(lastSynced, force);

    const serverResponse = full ? await this.fetch(lastSynced) : null;

    if (await this.send(data, newLastSynced)) {
      await this.stop(newLastSynced);
    } else if (serverResponse) {
      await this.stop(serverResponse.lastSynced);
    } else {
      await this.stop(serverLastSynced || oldLastSynced);
    }
  }

  async init(isForceSync) {
    if (this.connection.state !== signalr.HubConnectionState.Connected)
      await this.connection.start();

    await this.conflicts.recalculate();

    let lastSynced = await this.db.lastSynced();
    if (isForceSync) lastSynced = 0;

    const oldLastSynced = lastSynced;
    return { lastSynced, oldLastSynced };
  }

  async fetch(lastSynced) {
    const serverResponse = await new Promise((resolve, reject) => {
      let counter = { count: 0, queue: 0 };
      this.connection.stream("FetchItems", lastSynced).subscribe({
        next: (/** @type {SyncTransferItem} */ syncStatus) => {
          const { total, item, synced, lastSynced } = syncStatus;
          if (synced || !item) return;

          ++counter.count;
          ++counter.queue;
          const progress = counter.count;
          this.onSyncItem(syncStatus)
            .then(() => {
              sendSyncProgressEvent(
                this.db.eventManager,
                `download`,
                total,
                progress
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

    let data = await this.collector.collect(lastSynced, force);

    let { syncedAt } = await this.queue.get();
    if (syncedAt) {
      const newData = this.collector.filter(
        data,
        (item) => item.dateModified > syncedAt
      );
      await this.queue.merge(newData, newLastSynced);
    } else {
      await this.queue.new(data, newLastSynced);
    }

    return { newLastSynced, data };
  }

  /**
   *
   * @param {object} data
   * @param {number} lastSynced
   * @returns {Promise<boolean>}
   */
  async send(data, lastSynced) {
    await this.uploadAttachments();

    if (areAllEmpty(data)) return false;

    const { itemIds } = await this.queue.get();
    if (!itemIds) return false;

    const arrays = itemIds.reduce(
      (arrays, id) => {
        const [arrayKey, itemId] = id.split(":");
        const array = data[arrayKey] || [];

        const item = array.find((item) => item.id === itemId);
        if (!item) return arrays;

        const type = ITEM_TYPE_MAP[arrayKey];

        arrays.types.push(type);
        arrays.items.push(JSON.stringify(item));
        arrays.ids.push(id);

        return arrays;
      },
      { items: [], types: [], ids: [] }
    );

    if (data.vaultKey) {
      arrays.ids.push("vaultKey");
      arrays.types.push("vaultKey");
      arrays.items.push(JSON.stringify(data.vaultKey));
    }

    let total = arrays.ids.length;

    arrays.ids = toChunks(arrays.ids, 30);
    arrays.types = toChunks(arrays.types, 30);
    arrays.items = toChunks(arrays.items, 30);

    let index = 0;
    for (let i = 0; i < arrays.ids.length; ++i) {
      const ids = arrays.ids[i];
      const items = arrays.items[i];
      const types = arrays.types[i];

      const result = await this.sendBatchToServer({
        lastSynced,
        current: ++index,
        total,
        items,
        types,
      });

      if (result) {
        await this.queue.dequeue(...ids);
        sendSyncProgressEvent(
          this.db.eventManager,
          "upload",
          total,
          index * ids.length
        );
      }
    }
    return await this.connection.invoke("SyncCompleted", lastSynced);
  }

  async stop(lastSynced) {
    const storedLastSynced = await this.db.lastSynced();
    if (lastSynced > storedLastSynced)
      await this.db.storage.write("lastSynced", lastSynced);
    this.db.eventManager.publish(EVENTS.syncCompleted);
  }

  async cancel() {
    await this.connection.stop();
  }

  /**
   * @private
   */
  async uploadAttachments() {
    const attachments = this.db.attachments.pending;
    for (var i = 0; i < attachments.length; ++i) {
      const attachment = attachments[i];
      const { hash } = attachment.metadata;
      sendAttachmentsProgressEvent("upload", hash, attachments.length, i);

      try {
        const isUploaded = await this.db.fs.uploadFile(hash, hash);
        if (!isUploaded) throw new Error("Failed to upload file.");

        await this.db.attachments.markAsUploaded(attachment.id);
      } catch (e) {
        console.error(e, attachment);
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
    const result = await this.connection.invoke("SyncItem", batch);
    return result === 1;
  }
}

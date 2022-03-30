import set from "../../utils/set";
import { qclone } from "qclone";

export class SyncQueue {
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

  async dequeue(...ids) {
    const syncQueue = await this.get();
    if (!syncQueue || !syncQueue.itemIds) return;
    const { itemIds } = syncQueue;
    for (let id of ids) {
      const index = itemIds.findIndex((i) => i === id);
      if (index <= -1) continue;
      syncQueue.itemIds.splice(index, 1);
    }
    if (syncQueue.itemIds.length <= 0) await this.save(null);
    else await this.save(syncQueue);
  }

  /**
   *
   * @returns {Promise<{ itemIds: string[]; syncedAt: number; }>}
   */
  async get() {
    const syncQueue = await this.storage.read("syncQueue");
    if (!syncQueue || syncQueue.itemIds.length <= 0) return {};
    return qclone(syncQueue);
  }

  async save(syncQueue) {
    await this.storage.write("syncQueue", syncQueue);
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

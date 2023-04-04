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

import set from "../../utils/set";
import qclone from "qclone";
import { logger } from "../../../logger";

export class SyncQueue {
  /**
   *
   * @param {import("../../database/storage").default} storage
   */
  constructor(storage) {
    this.storage = storage;
    this.logger = logger.scope("SyncQueue");
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

    this.logger.info("Ids after merge", { itemIds });
    return syncData;
  }

  async dequeue(...ids) {
    const syncQueue = await this.get();
    if (!syncQueue || !syncQueue.itemIds) return;
    const { itemIds } = syncQueue;
    for (let id of ids) {
      const index = itemIds.findIndex((i) => i === id);
      if (index <= -1) continue;
      itemIds.splice(index, 1);
    }
    this.logger.info("Ids after dequeue", { itemIds });

    if (itemIds.length <= 0) await this.save(null);
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

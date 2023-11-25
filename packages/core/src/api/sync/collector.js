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

import { CURRENT_DATABASE_VERSION } from "../../common";
import { logger } from "../../logger";

const SYNC_COLLECTIONS_MAP = {
  note: "notes",
  notebook: "notebooks",
  shortcut: "shortcuts",
  reminder: "reminders",
  relation: "relations"
};

const ASYNC_COLLECTIONS_MAP = {
  content: "content"
};
class Collector {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this._db = db;
    this.logger = logger.scope("SyncCollector");
  }

  async *collect(chunkSize, lastSyncedTimestamp, isForceSync) {
    const key = await this._db.user.getEncryptionKey();

    const settings = await this.prepareChunk(
      [this._db.settings.raw],
      lastSyncedTimestamp,
      isForceSync,
      key,
      "settings"
    );
    if (settings) yield settings;

    const attachments = await this.prepareChunk(
      this._db.attachments.syncable,
      lastSyncedTimestamp,
      isForceSync,
      key,
      "attachment"
    );
    if (attachments) yield attachments;

    for (const itemType in ASYNC_COLLECTIONS_MAP) {
      const collectionKey = ASYNC_COLLECTIONS_MAP[itemType];
      const collection = this._db[collectionKey]._collection;
      for await (const chunk of collection.iterate(chunkSize)) {
        const items = await this.prepareChunk(
          chunk.map((item) => item[1]),
          lastSyncedTimestamp,
          isForceSync,
          key,
          itemType
        );
        if (!items) continue;
        yield items;
      }
    }

    for (const itemType in SYNC_COLLECTIONS_MAP) {
      const collectionKey = SYNC_COLLECTIONS_MAP[itemType];
      const collection = this._db[collectionKey]._collection;
      for (const chunk of collection.iterateSync(chunkSize)) {
        const items = await this.prepareChunk(
          chunk,
          lastSyncedTimestamp,
          isForceSync,
          key,
          itemType
        );
        if (!items) continue;
        yield items;
      }
    }
  }

  async prepareChunk(chunk, lastSyncedTimestamp, isForceSync, key, itemType) {
    const { ids, items } = filterSyncableItems(
      chunk,
      lastSyncedTimestamp,
      isForceSync
    );
    if (!ids.length) return;
    const ciphers = await this._db.storage.encryptMulti(key, items);
    return toPushItem(itemType, ids, ciphers);
  }
}
export default Collector;

function toPushItem(type, ids, ciphers) {
  const items = ciphers.map((cipher, index) => {
    cipher.v = CURRENT_DATABASE_VERSION;
    cipher.id = ids[index];
    return cipher;
  });
  return {
    items,
    type
  };
}

function filterSyncableItems(items, lastSyncedTimestamp, isForceSync) {
  if (!items || !items.length) return { items: [], ids: [] };

  const ids = [];
  const syncableItems = [];
  for (const item of items) {
    if (!item) continue;

    const isSyncable = !item.synced || isForceSync;
    const isUnsynced = item.dateModified > lastSyncedTimestamp || isForceSync;

    // in case of resolved content
    delete item.resolved;
    // synced is a local only property
    delete item.synced;

    if (isUnsynced && isSyncable) {
      ids.push(item.id);
      syncableItems.push(
        JSON.stringify(
          item.localOnly
            ? {
                id: item.id,
                deleted: true,
                dateModified: item.dateModified,
                deleteReason: "localOnly"
              }
            : item
        )
      );
    }
  }
  return { items: syncableItems, ids };
}

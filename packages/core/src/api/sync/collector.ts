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

import { Cipher } from "@notesnook/crypto";
import Database from "../index.js";
import { CURRENT_DATABASE_VERSION, EVENTS } from "../../common.js";
import { logger } from "../../logger.js";
import {
  SyncItem,
  SyncTransferItem,
  SYNC_COLLECTIONS_MAP,
  SYNC_ITEM_TYPES,
  KeyVersion,
  SyncableItemType
} from "./types.js";
import { Item, MaybeDeletedItem } from "../../types.js";

// the server drops any message over 100MB, and it rejects single items over 15MB, so one always fits
const MAX_BATCH_SIZE = 16 * 1024 * 1024;
// items are read and encrypted a fetch at a time, so large notes don't all sit in memory at once
const FETCH_SIZE = 100;

class Collector {
  logger = logger.scope("SyncCollector");
  constructor(private readonly db: Database) {}

  async hasUnsyncedChanges() {
    for (const itemType of SYNC_ITEM_TYPES) {
      const collectionKey = SYNC_COLLECTIONS_MAP[itemType];
      const collection = this.db[collectionKey].collection;
      if ((await collection.unsyncedCount()) > 0) return true;
    }
    return false;
  }

  async *collect(
    maxItems: number,
    isForceSync = false,
    maxSize = MAX_BATCH_SIZE
  ): AsyncGenerator<SyncTransferItem, void, unknown> {
    const keys = await this.db.user.getDataEncryptionKeys();
    if (!keys || !keys.length) {
      this.db.eventManager.publish(EVENTS.userSessionExpired);
      throw new Error("User encryption key not generated. Please relogin.");
    }

    // select the latest available key for encryption
    const key = keys.reduce((max, current) =>
      current.version > max.version ? current : max
    );

    for (const itemType of SYNC_ITEM_TYPES) {
      const collectionKey = SYNC_COLLECTIONS_MAP[itemType];
      const collection = this.db[collectionKey].collection;

      let batch: SyncItem[] = [];
      let modified: [string, number][] = [];
      let size = 0;
      for await (const chunk of collection.unsynced(FETCH_SIZE, isForceSync)) {
        const { ids, items: syncableItems } = filterSyncableItems(chunk);
        if (!ids.length) continue;
        const ciphers = await this.db
          .storage()
          .encryptMulti(key.key, syncableItems);
        const items = toSyncItem(ids, ciphers, key.version);
        this.logger.debug(
          `Collected ${items.length} items for type ${itemType}`,
          { ids }
        );

        for (let i = 0; i < items.length; ++i) {
          const length = items[i].cipher.length;
          if (
            batch.length >= maxItems ||
            (batch.length > 0 && size + length > maxSize)
          ) {
            yield { items: batch, type: itemType, count: batch.length };
            await this.markSynced(collection.type, modified);
            batch = [];
            modified = [];
            size = 0;
          }
          batch.push(items[i]);
          modified.push([chunk[i].id, chunk[i].dateModified]);
          size += length;
        }
      }
      if (batch.length > 0) {
        yield { items: batch, type: itemType, count: batch.length };
        await this.markSynced(collection.type, modified);
      }
    }
  }

  private markSynced(
    type: Database[(typeof SYNC_COLLECTIONS_MAP)[SyncableItemType]]["collection"]["type"],
    modified: [string, number][]
  ) {
    return (
      this.db
        .sql()
        .updateTable(type)
        // EDGE CASE:
        // Sometimes an item can get updated while it's being pushed.
        // The result is that its `synced` property becomes true even
        // though it's modification wasn't yet synced.
        // In order to prevent that, we only set the `synced` property
        // to true for items whose `dateModified` is still the same as
        // the one we pushed. Everything else will be collected again in
        // the next push. Comparing against the pushed value (instead of
        // the current time) also handles items with a `dateModified` in
        // the future.
        .where((eb) =>
          eb.or(
            modified.map(([id, dateModified]) =>
              eb.and([eb("id", "=", id), eb("dateModified", "=", dateModified)])
            )
          )
        )
        .set({ synced: true })
        .execute()
    );
  }
}
export default Collector;

function toSyncItem(
  ids: string[],
  ciphers: Cipher<"base64">[],
  keyVersion: KeyVersion
) {
  if (ids.length !== ciphers.length)
    throw new Error("ids.length must be equal to ciphers.length");

  const items: SyncItem[] = [];
  for (let i = 0; i < ids.length; ++i) {
    const id = ids[i];
    const cipher = ciphers[i] as SyncItem;
    cipher.v = CURRENT_DATABASE_VERSION;
    cipher.id = id;
    cipher.keyVersion = keyVersion;
    items.push(cipher);
  }
  return items;
}

function filterSyncableItems(items: MaybeDeletedItem<Item>[]): {
  items: string[];
  ids: string[];
} {
  if (!items || !items.length) return { items: [], ids: [] };

  const ids = [];
  const syncableItems = [];
  for (const item of items) {
    delete item.synced;

    ids.push(item.id);
    syncableItems.push(
      JSON.stringify(
        "localOnly" in item && item.localOnly
          ? {
              id: item.id,
              deleted: true,
              dateModified: item.dateModified
            }
          : item
      )
    );
  }
  return { items: syncableItems, ids };
}

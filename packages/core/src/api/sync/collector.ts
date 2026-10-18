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
  KeyVersion
} from "./types.js";
import { Item, MaybeDeletedItem } from "../../types.js";

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
    chunkSize: number,
    isForceSync = false
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
      for await (const chunk of collection.unsynced(chunkSize, isForceSync)) {
        const modified = chunk.map((i) => [i.id, i.dateModified] as const);
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
        yield { items, type: itemType, count: items.length };

        await this.db
          .sql()
          .updateTable(collection.type)
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
                eb.and([
                  eb("id", "=", id),
                  eb("dateModified", "=", dateModified)
                ])
              )
            )
          )
          .set({ synced: true })
          .execute();
      }
    }
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

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

import { Cipher, SerializedKey } from "@notesnook/crypto";
import Database from "..";
import { CURRENT_DATABASE_VERSION, EV, EVENTS } from "../../common";
import { logger } from "../../logger";
import { SYNC_COLLECTIONS_MAP, SyncItem, SyncTransferItem } from "./types";
import { Item, MaybeDeletedItem } from "../../types";

const ASYNC_COLLECTIONS_MAP = {
  content: "content"
} as const;
class Collector {
  logger = logger.scope("SyncCollector");
  constructor(private readonly db: Database) {}

  async *collect(
    chunkSize: number,
    lastSyncedTimestamp: number,
    isForceSync = false
  ): AsyncGenerator<SyncTransferItem, void, unknown> {
    const key = await this.db.user.getEncryptionKey();
    if (!key || !key.key || !key.salt) {
      EV.publish(EVENTS.userSessionExpired);
      throw new Error("User encryption key not generated. Please relogin.");
    }

    const attachments = await this.prepareChunk(
      this.db.attachments.syncable,
      lastSyncedTimestamp,
      isForceSync,
      key
    );
    if (attachments) yield { items: attachments, type: "attachment" };

    for (const itemType in ASYNC_COLLECTIONS_MAP) {
      const collectionKey =
        ASYNC_COLLECTIONS_MAP[itemType as keyof typeof ASYNC_COLLECTIONS_MAP];
      const collection = this.db[collectionKey].collection;
      for await (const chunk of collection.iterate(chunkSize)) {
        const items = await this.prepareChunk(
          chunk.map((item) => item[1]),
          lastSyncedTimestamp,
          isForceSync,
          key
        );
        if (!items) continue;
        yield { items, type: itemType as keyof typeof ASYNC_COLLECTIONS_MAP };
      }
    }

    // for (const itemType in SYNC_COLLECTIONS_MAP) {
    //   const collectionKey =
    //     SYNC_COLLECTIONS_MAP[itemType as keyof typeof SYNC_COLLECTIONS_MAP];
    //   const collection = this.db[collectionKey].collection;
    //   for (const chunk of collection.iterateSync(chunkSize)) {
    //     const items = await this.prepareChunk(
    //       chunk,
    //       lastSyncedTimestamp,
    //       isForceSync,
    //       key
    //     );
    //     if (!items) continue;
    //     yield { items, type: itemType as keyof typeof SYNC_COLLECTIONS_MAP };
    //   }
    // }
  }

  async prepareChunk(
    chunk: MaybeDeletedItem<Item>[],
    lastSyncedTimestamp: number,
    isForceSync: boolean,
    key: SerializedKey
  ) {
    const { ids, items } = filterSyncableItems(
      chunk,
      lastSyncedTimestamp,
      isForceSync
    );
    if (!ids.length) return;
    const ciphers = await this.db.storage().encryptMulti(key, items);
    return toPushItem(ids, ciphers);
  }
}
export default Collector;

function toPushItem(ids: string[], ciphers: Cipher<"base64">[]) {
  if (ids.length !== ciphers.length)
    throw new Error("ids.length must be equal to ciphers.length");

  const items: SyncItem[] = [];
  for (let i = 0; i < ids.length; ++i) {
    const id = ids[i];
    const cipher = ciphers[i];
    items.push({ ...cipher, v: CURRENT_DATABASE_VERSION, id });
  }
  return items;
}

function filterSyncableItems(
  items: MaybeDeletedItem<Item>[],
  lastSyncedTimestamp: number,
  isForceSync = false
): { items: string[]; ids: string[] } {
  if (!items || !items.length) return { items: [], ids: [] };

  const ids = [];
  const syncableItems = [];
  for (const item of items) {
    if (!item) continue;

    const isSyncable = !item.synced || isForceSync;
    const isUnsynced = item.dateModified > lastSyncedTimestamp || isForceSync;

    // synced is a local only property
    delete item.synced;

    if (isUnsynced && isSyncable) {
      ids.push(item.id);
      syncableItems.push(
        JSON.stringify(
          "localOnly" in item && item.localOnly
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

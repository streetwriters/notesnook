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

import { BaseItem, FailedSyncItem } from "../types.js";
import Database from "../api/index.js";
import { ICollection } from "./collection.js";
import { SQLCollection } from "../database/sql-collection.js";
import { isFalse } from "../database/index.js";
import { getId } from "../utils/id.js";
import { SYNC_COLLECTIONS_MAP } from "../api/sync/types.js";
import type { SyncableItemType } from "../api/sync/types.js";
import { logger } from "../logger.js";

export class FailedSyncItems implements ICollection {
  name = "failedsyncitems";
  readonly collection: SQLCollection<"failedsyncitems", FailedSyncItem>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "failedsyncitems",
      db.eventManager,
      db.sanitizer
    );
  }

  init() {
    return this.collection.init();
  }

  async add(item: Omit<FailedSyncItem, keyof BaseItem<"failedsyncitem">>) {
    const now = Date.now();
    const id = getId();
    await this.collection.upsert({
      type: "failedsyncitem",
      dateCreated: now,
      dateModified: now,
      ...item,
      id
    });
    return id;
  }

  get all() {
    return this.collection.createFilter<FailedSyncItem>(
      (qb) => qb.where(isFalse("deleted")),
      this.db.options?.batchSize
    );
  }

  async delete(ids: string[]) {
    const groupedItems: Partial<Record<SyncableItemType, FailedSyncItem[]>> =
      {};
    for (const item of await this.all.items(ids)) {
      const grouped = groupedItems[item.itemType] ?? [];
      grouped.push(item);
      groupedItems[item.itemType] = grouped;
    }
    for (const [itemType, items] of Object.entries(groupedItems)) {
      const collectionType = SYNC_COLLECTIONS_MAP[itemType as SyncableItemType];
      const collection = this.db[collectionType];
      if (!collectionType || !collection) {
        logger.error(
          new Error(`Unknown collection type: ${itemType}`),
          `Failed to delete failed sync items because the collection type is unknown.`
        );
        continue;
      }
      await collection.collection.softDelete(items.map((item) => item.itemId));
    }
    await this.collection.delete(ids);
  }

  async clear() {
    const ids = await this.all.ids();
    await this.delete(ids);
  }
}

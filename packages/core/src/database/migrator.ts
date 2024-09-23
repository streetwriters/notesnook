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
import { DatabaseSchema } from "./index.js";
import Database from "../api/index.js";
import {
  CURRENT_DATABASE_VERSION,
  sendMigrationProgressEvent
} from "../common.js";
import {
  migrateCollection,
  migrateItem,
  migrateKV,
  migrateVaultKey
} from "../migrations.js";
import {
  CollectionType,
  Collections,
  Item,
  LegacySettingsItem,
  MaybeDeletedItem,
  isDeleted,
  isTrashItem
} from "../types.js";
import { IndexedCollection } from "./indexed-collection.js";
import { SQLCollection } from "./sql-collection.js";
import { logger } from "../logger.js";

export type RawItem = MaybeDeletedItem<Item>;
type MigratableCollection = {
  // iterate?: boolean;
  // items?: () => (RawItem | undefined)[];
  name: CollectionType;
  table: keyof DatabaseSchema;
};
export type MigratableCollections = MigratableCollection[];

class Migrator {
  async migrate(
    db: Database,
    collections: MigratableCollections,
    version: number
  ) {
    if (version <= 5.9) {
      const vaultKey = await db.storage().read<Cipher<"base64">>("vaultKey");
      if (vaultKey)
        await migrateVaultKey(db, vaultKey, version, CURRENT_DATABASE_VERSION);
      await migrateKV(db, version, CURRENT_DATABASE_VERSION);
    }

    for (const collection of collections) {
      sendMigrationProgressEvent(db.eventManager, collection.name, 0, 0);

      const table = new SQLCollection(
        db.sql,
        db.transaction,
        collection.table,
        db.eventManager,
        db.sanitizer
      );
      if (version <= 5.9) {
        if (collection.name === "settings") {
          const settings = await db
            .storage()
            .read<LegacySettingsItem>("settings");
          if (!settings) continue;
          await migrateItem(
            settings,
            version,
            CURRENT_DATABASE_VERSION,
            "settings",
            db,
            "local"
          );
          await db.storage().remove("settings");
        } else {
          const indexedCollection = new IndexedCollection(
            db.storage,
            collection.name
          );

          await migrateCollection(indexedCollection, version);

          await indexedCollection.init();
          await table.init();
          let count = 0;
          for await (const entries of indexedCollection.iterate(100)) {
            await this.migrateToSQLite(
              db,
              table,
              entries.map((i) => i[1]),
              version
            );
            sendMigrationProgressEvent(
              db.eventManager,
              collection.name,
              indexedCollection.indexer.indices.length,
              (count += 100)
            );
          }
          await indexedCollection.clear();
        }
      } else {
        await table.init();
        await this.migrateItems(db, table, collection.name, version);
      }
    }

    await db.initCollections();
    return true;
  }

  private async migrateToSQLite(
    db: Database,
    table: SQLCollection<keyof DatabaseSchema>,
    items: (RawItem | undefined)[],
    version: number
  ) {
    const toAdd = [];
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      // can be true due to corrupted data.
      if (Array.isArray(item)) {
        logger.debug("Skipping item during migration to SQLite", {
          table,
          version,
          item
        });
        continue;
      }
      if (!item) continue;

      let migrated = await migrateItem(
        item,
        version,
        CURRENT_DATABASE_VERSION,
        isDeleted(item) ? "never" : item.type,
        db,
        "local"
      );

      // trash item is also a notebook or a note so we have to migrate it separately.
      if (isTrashItem(item)) {
        migrated = await migrateItem(
          item as any,
          version,
          CURRENT_DATABASE_VERSION,
          item.itemType,
          db,
          "local"
        );
      }

      if (migrated !== "skip") toAdd.push(item);
    }

    if (toAdd.length > 0) {
      await table.put(toAdd as any);
    }
  }

  private async migrateItems(
    db: Database,
    table: SQLCollection<keyof DatabaseSchema>,
    type: keyof Collections,
    version: number
  ) {
    let progress = 0;
    let toAdd = [];
    let toDelete = [];
    for await (const item of table.stream(100)) {
      if (toAdd.length >= 500) {
        await table.put(toAdd as any);
        await table.delete(toDelete);
        progress += toAdd.length;
        sendMigrationProgressEvent(db.eventManager, type, progress, progress);
        toAdd = [];
        toDelete = [];
      }

      const itemId = item.id;
      let migrated = await migrateItem(
        item as any,
        version,
        CURRENT_DATABASE_VERSION,
        isDeleted(item) ? "never" : item.type || "never",
        db,
        "local"
      );

      // trash item is also a notebook or a note so we have to migrate it separately.
      if (isTrashItem(item)) {
        migrated = await migrateItem(
          item as any,
          version,
          CURRENT_DATABASE_VERSION,
          item.itemType,
          db,
          "local"
        );
      }

      if (!migrated || migrated === "skip") continue;

      toAdd.push(item);

      // if id changed after migration, we need to delete the old one.
      if (item.id !== itemId) {
        toDelete.push(itemId);
      }
    }

    await table.put(toAdd as any);
    await table.delete(toDelete);
    progress += toAdd.length;
    sendMigrationProgressEvent(db.eventManager, type, progress, progress);
    toAdd = [];
    toDelete = [];
  }
}
export default Migrator;

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

import { sendMigrationProgressEvent } from "../common";
import { migrateCollection, migrateItem } from "../migrations";

class Migrator {
  async migrate(db, collections, get, version) {
    for (let collection of collections) {
      if (
        (!collection.iterate && !collection.index) ||
        !collection.dbCollection
      )
        continue;

      if (collection.dbCollection.collectionName)
        sendMigrationProgressEvent(
          db.eventManager,
          collection.dbCollection.collectionName,
          0,
          0
        );

      await migrateCollection(collection.dbCollection, version);

      if (collection.index) {
        await this.migrateItems(
          db,
          collection,
          collection.index(),
          get,
          version
        );
      } else if (collection.iterate) {
        for await (const index of collection.dbCollection._collection.iterate(
          100
        )) {
          await this.migrateItems(db, collection, index, get, version);
        }
      }
    }
    return true;
  }

  async migrateItems(db, collection, index, get, version) {
    const toAdd = [];
    for (var i = 0; i < index.length; ++i) {
      let id = index[i];
      let item = get(id, collection.dbCollection.collectionName);
      if (!item) {
        continue;
      }

      // check if item is permanently deleted or just a soft delete
      if (item.deleted && !item.type) {
        await collection.dbCollection?._collection?.addItem(item);
        continue;
      }

      const itemId = item.id;
      const migrated = await migrateItem(
        item,
        version,
        item.type || collection.type || collection.dbCollection.type,
        db
      );

      if (migrated) {
        if (collection.type === "settings") {
          await collection.dbCollection.merge(item);
        } else if (item.type === "note") {
          toAdd.push(await db.notes.merge(null, item));
        } else if (collection.dbCollection._collection) {
          toAdd.push(item);
        } else {
          throw new Error(
            `No idea how to handle this kind of item: ${item.type}.`
          );
        }

        // if id changed after migration, we need to delete the old one.
        if (item.id !== itemId) {
          await collection.dbCollection._collection.deleteItem(itemId);
        }
      }
    }

    if (toAdd.length > 0) {
      await collection.dbCollection._collection.setItems(toAdd);
      if (collection.dbCollection.collectionName)
        sendMigrationProgressEvent(
          db.eventManager,
          collection.dbCollection.collectionName,
          toAdd.length,
          toAdd.length
        );
    }
  }
}
export default Migrator;

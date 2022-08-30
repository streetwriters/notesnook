/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { migrations } from "../migrations";

class Migrator {
  async migrate(collections, get, version) {
    for (let collection of collections) {
      if (!collection.index || !collection.dbCollection) continue;
      for (var i = 0; i < collection.index.length; ++i) {
        let id = collection.index[i];
        let item = get(id);
        if (!item) {
          continue;
        }

        if (item.deleted && !item.type) {
          await collection.dbCollection?._collection?.addItem(item);
          continue;
        }
        const migrate = migrations[version][item.type || collection.type];
        if (migrate) item = migrate(item);

        if (collection.dbCollection.merge) {
          await collection.dbCollection.merge(item);
        } else {
          await collection.dbCollection.add(item);
        }
      }
    }
    return true;
  }
}
export default Migrator;

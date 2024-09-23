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

import { toChunks } from "../utils/array.js";
import { StorageAccessor } from "../interfaces.js";
import {
  CollectionType,
  Collections,
  ItemMap,
  MaybeDeletedItem
} from "../types.js";
import Indexer from "./indexer.js";

/**
 * @deprecated only kept here for migration purposes
 */
export class IndexedCollection<
  TCollectionType extends CollectionType = CollectionType,
  T extends ItemMap[Collections[TCollectionType]] = ItemMap[Collections[TCollectionType]]
> {
  readonly indexer: Indexer<T>;

  constructor(storage: StorageAccessor, type: TCollectionType) {
    this.indexer = new Indexer(storage, type);
  }

  clear() {
    return this.indexer.clear();
  }

  async deleteItem(id: string) {
    await this.indexer.deindex(id);
    return await this.indexer.remove(id);
  }

  async init() {
    await this.indexer.init();
  }

  async addItem(item: MaybeDeletedItem<T>) {
    await this.indexer.write(item.id, item);
    await this.indexer.index(item.id);
  }

  exists(id: string) {
    return this.indexer.exists(id);
  }

  async *iterate(chunkSize: number) {
    const chunks = toChunks(this.indexer.indices, chunkSize);
    for (const chunk of chunks) {
      yield await this.indexer.readMulti(chunk);
    }
  }
}

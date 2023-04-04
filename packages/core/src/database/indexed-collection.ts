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

import { EVENTS } from "../common";
import { BaseItem, Collections, CollectionType } from "../entities";
import { IStorage } from "../interfaces";
import Indexer from "./indexer";

export default class IndexedCollection<
  TCollectionType extends CollectionType,
  T extends BaseItem<Collections[TCollectionType]>
> {
  /**
   * @internal
   */
  readonly indexer: Indexer<T>;
  constructor(
    protected readonly storage: IStorage,
    type: TCollectionType
    // eventManager
  ) {
    this.indexer = new Indexer(storage, type);
    // this.eventManager = eventManager;
  }

  clear() {
    return this.indexer.clear();
  }

  async init() {
    await this.indexer.init();
  }

  async addItem(item: T) {
    if (!item.id) throw new Error("The item must contain the id field.");

    const exists = this.exists(item.id);
    if (!exists) item.dateCreated = item.dateCreated || Date.now();
    await this.updateItem(item);
    if (!exists) {
      await this.indexer.index(item.id);
    }
  }

  async updateItem(item: T) {
    if (!item.id) throw new Error("The item must contain the id field.");
    this.notify(item.id, item);

    // if item is newly synced, remote will be true.
    if (!item.remote) {
      item.dateModified = Date.now();
      item.synced = false;
    }
    // the item has become local now, so remove the flags
    delete item.remote;

    await this.indexer.write(item.id, item);
  }

  removeItem(id: string) {
    this.notify(id);
    return this.indexer.write(id, {
      id,
      deleted: true
    });
  }

  async deleteItem(id: string) {
    this.notify(id);
    await this.indexer.deindex(id);
    return await this.indexer.remove(id);
  }

  exists(id: string) {
    return this.indexer.exists(id);
  }

  async getItemAsync(id: string) {
    const item = await this.indexer.read(id);
    if (!item) return;
    return item;
  }

  async getItemsAsync(ids: string[]) {
    const data = await this.indexer.readMulti(ids);
    return Object.fromEntries(data);
  }

  private notify(id: string, item?: Partial<T>) {
    // this.eventManager.publish(EVENTS.databaseUpdated, id, item);
  }
}

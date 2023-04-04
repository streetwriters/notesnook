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

import CachedCollection from "../database/cached-collection";
import { BaseItem, Collections, CollectionType } from "../entities";
import { IStorage } from "../interfaces";

export interface ICollection<
  TCollectionType extends CollectionType,
  T extends BaseItem<Collections[TCollectionType]>
> {
  merge(item: T): Promise<void>;
  // add(item: Partial<T>): Promise<string | undefined>;
  // delete(...ids: string[]): Promise<void>;
}

abstract class Collection<
  TCollectionType extends CollectionType,
  T extends BaseItem<Collections[TCollectionType]>
> {
  protected collection: CachedCollection<TCollectionType, T>;

  // static async new(db, name, cached = true, deferred = false) {
  //   const collection = new this(db, name, cached);

  //   if (!deferred) await collection.init();
  //   else await collection._collection.indexer.init();

  //   if (collection._collection.clear)
  //     EV.subscribe(
  //       EVENTS.userLoggedOut,
  //       async () => await collection._collection.clear()
  //     );

  //   return collection;
  // }

  // async init() {
  //   if (this.initialized) return;
  //   await this._collection.init();
  //   EV.publish(EVENTS.databaseCollectionInitiated, this.collectionName);
  //   this.initialized = true;
  // }

  constructor(storage: IStorage, name: TCollectionType) {
    this.collection = new CachedCollection(storage, name);

    // this._db = db;
    // this.collectionName = name;
    // if (cached)
    //   this._collection = new CachedCollection(
    //     this._db.storage,
    //     name,
    //     this._db.eventManager
    //   );
    // else
    //   this._collection = new IndexedCollection(
    //     this._db.storage,
    //     name,
    //     this._db.eventManager
    //   );
  }
  abstract merge(item: T): Promise<void>;
}
export default Collection;

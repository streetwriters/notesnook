import { EV, EVENTS } from "../common";
import CachedCollection from "../database/cached-collection";
import IndexedCollection from "../database/indexed-collection";

class Collection {
  static async new(db, name, cached = true, deferred = false) {
    const collection = new this(db, name, cached);

    if (!deferred) await collection.init();
    else await collection._collection.indexer.init();

    if (collection._collection.clear)
      EV.subscribe(
        EVENTS.userLoggedOut,
        async () => await collection._collection.clear()
      );

    return collection;
  }

  async init() {
    if (this.initialized) return;
    await this._collection.init();
    EV.publish(EVENTS.databaseCollectionInitiated, this.collectionName);
    this.initialized = true;
  }

  /**
   *
   * @param {import("../api").default} db
   */
  constructor(db, name, cached) {
    this._db = db;
    this.collectionName = name;
    if (cached)
      this._collection = new CachedCollection(
        this._db.storage,
        name,
        this._db.eventManager
      );
    else
      this._collection = new IndexedCollection(
        this._db.storage,
        name,
        this._db.eventManager
      );
  }

  async encrypted() {
    const data = await this._collection.indexer.readMulti(
      this._collection.indexer.getIndices()
    );
    return data.map((d) => d[1]);
  }
}
export default Collection;

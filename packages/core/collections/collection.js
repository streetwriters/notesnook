import CachedCollection from "../database/cached-collection";
import IndexedCollection from "../database/indexed-collection";

class Collection {
  static async new(db, cached = true, name = undefined) {
    const collection = new this(db, cached, name || this.name.toLowerCase());
    await collection._collection.init();
    if (collection.init) await collection.init();
    return collection;
  }

  /**
   *
   * @param {import("../api").default} db
   */
  constructor(db, cached, name) {
    this._db = db;
    if (cached) this._collection = new CachedCollection(this._db.context, name);
    else this._collection = new IndexedCollection(this._db.context, name);
  }
}
export default Collection;

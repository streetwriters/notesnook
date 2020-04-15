import CachedCollection from "../database/cached-collection";
import IndexedCollection from "../database/indexed-collection";

class Collection {
  static async new(db, name = undefined, cached = true) {
    const collection = new this(db, name || this.name.toLowerCase(), cached);
    await collection._collection.init();

    if (collection.init) await collection.init();
    if (collection._collection.clear)
      db.ev.subscribe("clear", () => collection._collection.clear());

    return collection;
  }

  /**
   *
   * @param {import("../api").default} db
   */
  constructor(db, name, cached) {
    this._db = db;
    if (cached) this._collection = new CachedCollection(this._db.context, name);
    else this._collection = new IndexedCollection(this._db.context, name);
  }
}
export default Collection;

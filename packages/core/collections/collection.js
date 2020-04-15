import CachedCollection from "../database/cached-collection";

class Collection {
  static async new(db) {
    const collection = new this(db, this.name.toLowerCase());
    await collection._collection.init();
    return collection;
  }

  /**
   *
   * @param {import("../api").default} db
   */
  constructor(db, name) {
    this._db = db;
    this._collection = new CachedCollection(this._db.context, name);
  }
}
export default Collection;

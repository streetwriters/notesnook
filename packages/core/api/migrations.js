import { CURRENT_DATABASE_VERSION } from "../common";
import { migrations } from "../migrations";

class Migrations {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
    this.dbVersion = CURRENT_DATABASE_VERSION;
  }

  async init() {
    this.dbVersion = (await this._db.context.read("v")) || 2;
  }

  get _shouldMigrate() {
    return this.dbVersion < CURRENT_DATABASE_VERSION;
  }

  _migrationFunction(collectionId) {
    let migrationFunction = migrations[this.dbVersion][collectionId];
    if (!migrationFunction)
      migrationFunction = migrations[CURRENT_DATABASE_VERSION][collectionId];
    return migrationFunction;
  }

  async migrate() {
    if (!this._shouldMigrate) return;
    const collections = [
      "notes",
      "notebooks",
      "tags",
      "colors",
      "trash",
      "delta",
      "text",
      "content",
      "settings",
    ];

    await Promise.all(
      collections.map(async (collectionId) => {
        const collection = this._db[collectionId];
        if (!collection) return;

        const items =
          collectionId === "content" || collectionId === "delta"
            ? await collection.all()
            : collectionId === "settings"
            ? [collection.raw]
            : collection.raw;

        await Promise.all(
          items.map(async (item) => {
            await this._migrationFunction(collectionId)(this._db, item);
          })
        );
      })
    );
    await this._db.context.write("v", CURRENT_VERSION);
  }
}
export default Migrations;

import { CURRENT_DATABASE_VERSION, EV } from "../common";
import Migrator from "../database/migrator";

class Migrations {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
    this._migrator = new Migrator();
  }

  async init() {
    this.dbVersion = (await this._db.context.read("v")) || 2;
  }

  async migrate() {
    if (this.dbVersion > CURRENT_DATABASE_VERSION) return;

    await this._db.notes.init();
    const content = await this._db.content.all();

    const collections = [
      {
        id: "notes",
        index: this._db.notes.raw,
        dbCollection: this._db.notes,
      },
      {
        id: "notebooks",
        index: this._db.notebooks.raw,
        dbCollection: this._db.notebooks,
      },
      {
        id: "tags",
        index: this._db.tags.raw,
        dbCollection: this._db.tags,
      },
      {
        id: "colors",
        index: this._db.colors.raw,
        dbCollection: this._db.colors,
      },
      {
        id: "trash",
        index: this._db.trash.raw,
        dbCollection: this._db.trash,
      },
      {
        id: "content",
        index: content,
        dbCollection: this._db.content,
      },
      {
        id: "settings",
        index: [this._db.settings.raw],
        dbCollection: this._db.settings,
      },
    ];
    await this._migrator.migrate(collections, (item) => item, this.dbVersion);
    await this._db.context.write("v", CURRENT_DATABASE_VERSION);

    EV.publish("db:onMigrationDone", {
      prev: this.dbVersion,
      current: CURRENT_DATABASE_VERSION,
    });

    this.dbVersion = CURRENT_DATABASE_VERSION;
  }
}
export default Migrations;

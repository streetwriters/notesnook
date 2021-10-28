import { CURRENT_DATABASE_VERSION, EV, EVENTS } from "../common";
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
    this.dbVersion =
      (await this._db.storage.read("v")) || CURRENT_DATABASE_VERSION;
    this._db.storage.write("v", this.dbVersion);
  }

  async migrate() {
    if (this.dbVersion >= CURRENT_DATABASE_VERSION) return;

    await this._db.notes.init();
    const content = await this._db.content.all();

    const collections = [
      { index: this._db.attachments.all, dbCollection: this._db.attachments },
      {
        index: this._db.notebooks.raw,
        dbCollection: this._db.notebooks,
      },
      {
        index: this._db.tags.raw,
        dbCollection: this._db.tags,
      },
      {
        index: this._db.colors.raw,
        dbCollection: this._db.colors,
      },
      {
        index: this._db.trash.raw,
        dbCollection: this._db.trash,
      },
      {
        index: content,
        dbCollection: this._db.content,
      },
      {
        index: [this._db.settings.raw],
        dbCollection: this._db.settings,
        type: "settings",
      },
      {
        index: this._db.notes.raw,
        dbCollection: this._db.notes,
      },
    ];
    await this._migrator.migrate(collections, (item) => item, this.dbVersion);
    await this._db.storage.write("v", CURRENT_DATABASE_VERSION);

    EV.publish(EVENTS.databaseMigrated, {
      prev: this.dbVersion,
      current: CURRENT_DATABASE_VERSION,
    });

    this.dbVersion = CURRENT_DATABASE_VERSION;
  }
}
export default Migrations;

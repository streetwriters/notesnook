import { CURRENT_DATABASE_VERSION } from "../../common";
import Database from "../index";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

class Collector {
  /**
   *
   * @param {Database} db
   */
  constructor(db) {
    this._db = db;
  }

  async collect(lastSyncedTimestamp) {
    this._lastSyncedTimestamp = lastSyncedTimestamp;
    this.key = await this._db.user.key();
    return {
      notes: await this._collect(this._db.notes.raw),
      notebooks: await this._collect(this._db.notebooks.raw),
      content: await this._collect(await this._db.content.all()),
      tags: await this._collect(this._db.tags.raw),
      colors: await this._collect(this._db.colors.raw),
      trash: await this._collect(this._db.trash.raw),
      settings: await this._collect([this._db.settings.raw]),
      vaultKey: await this._serialize(await this._db.vault._getKey()),
    };
  }

  _serialize(item) {
    if (!item) return;
    return this._db.context.encrypt(this.key, JSON.stringify(item));
  }

  _collect(array) {
    return Promise.all(
      tfun
        .filter((item) => item.dateEdited > this._lastSyncedTimestamp)
        .map(async (item) => {
          // in case of resolved delta, we do not want to send this key to the server
          if (item.resolved) delete item.resolved;

          return {
            id: item.id,
            v: CURRENT_DATABASE_VERSION,
            ...(await this._serialize(item)),
          };
        })(array)
    );
  }
}
export default Collector;

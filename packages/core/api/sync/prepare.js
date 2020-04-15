import Database from "../index";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

class Prepare {
  /**
   *
   * @param {Database} db
   */
  constructor(db) {
    this._db = db;
  }

  async get(lastSyncedTimestamp) {
    this._lastSyncedTimestamp = lastSyncedTimestamp;
    this.key = await this._db.user.key();
    return {
      notes: await this._prepareForServer(this._db.notes.raw),
      notebooks: await this._prepareForServer(this._db.notebooks.raw),
      delta: await this._prepareForServer(await this._db.delta.all()),
      text: await this._prepareForServer(await this._db.text.all()),
      tags: await this._prepareForServer(this._db.tags.raw),
      colors: await this._prepareForServer(this._db.colors.raw),
      trash: await this._prepareForServer(this._db.trash.raw),
      vaultKey: await this._serialize(await this._db.vault._getKey()),
    };
  }

  _serialize(item) {
    return this._db.context.encrypt(this.key, JSON.stringify(item));
  }

  _prepareForServer(array) {
    return Promise.all(
      tfun
        .filter((item) => item.dateEdited > this._lastSyncedTimestamp)
        .map(async (item) => {
          // in case of resolved delta, we do not want to send this key to the server
          if (item.resolved) delete item.resolved;

          return {
            id: item.id,
            ...(await this._serialize(item)),
          };
        })(array)
    );
  }
}
export default Prepare;

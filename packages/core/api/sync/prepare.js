import Database from "../index";

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
    return {
      notes: this._prepareForServer(this._db.notes.raw),
      notebooks: this._prepareForServer(this._db.notebooks.raw),
      delta: this._prepareForServer(await this._db.delta.all()),
      text: this._prepareForServer(await this._db.text.all()),
      tags: this._prepareForServer(this._db.tags.raw),
      colors: this._prepareForServer(this._db.colors.raw),
      trash: this._prepareForServer(this._db.trash.raw),
      lastSynced: Date.now(),
    };
  }

  _prepareForServer(array) {
    return tfun
      .filter((item) => item.dateEdited > this._lastSyncedTimestamp)
      .map((item) => ({
        id: item.id,
        data: JSON.stringify(item),
      }))(array);
  }
}
export default Prepare;

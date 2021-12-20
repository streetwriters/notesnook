import { CURRENT_DATABASE_VERSION } from "../../common";
import { getContentFromData } from "../../content-types";
import { diff } from "../../utils/array";
import Database from "../index";

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
    this.key = await this._db.user.getEncryptionKey();
    return {
      notes: await this._encrypt(this._collect(this._db.notes.raw)),
      notebooks: await this._encrypt(this._collect(this._db.notebooks.raw)),
      content: await this._encrypt(this._collect(await this._db.content.all())),
      attachments: await this._encrypt(this._collect(this._db.attachments.all)),
      settings: await this._encrypt(this._collect([this._db.settings.raw])),
      vaultKey: await this._serialize(await this._db.vault._getKey()),
    };
  }

  _serialize(item) {
    if (!item) return null;
    return this._db.storage.encrypt(this.key, JSON.stringify(item));
  }

  _encrypt(array) {
    if (!array.length) return [];
    return Promise.all(array.map(this._map, this));
  }

  /**
   *
   * @param {Array} array
   * @returns {Array}
   */
  _collect(array) {
    if (!array.length) return [];
    return array.reduce((prev, item) => {
      if (!item || item.localOnly) return prev;
      if (item.dateModified > this._lastSyncedTimestamp || item.migrated)
        prev.push(item);
      return prev;
    }, []);
  }

  async _map(item) {
    // in case of resolved content
    delete item.resolved;
    // turn the migrated flag off so we don't keep syncing this item repeated
    delete item.migrated;

    return {
      id: item.id,
      v: CURRENT_DATABASE_VERSION,
      ...(await this._serialize(item)),
    };
  }
}
export default Collector;

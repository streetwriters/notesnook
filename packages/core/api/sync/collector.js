import { CURRENT_DATABASE_VERSION } from "../../common";
import { logger } from "../../logger";

class Collector {
  /**
   *
   * @param {Database} db
   */
  constructor(db) {
    this._db = db;
    this.logger = logger.scope("SyncCollector");
  }

  async collect(lastSyncedTimestamp, isForceSync) {
    await this._db.notes.init();

    this._lastSyncedTimestamp = lastSyncedTimestamp;
    this.key = await this._db.user.getEncryptionKey();

    const items = [
      ...this._collect("note", this._db.notes.raw, isForceSync),
      ...this._collect("notebook", this._db.notebooks.raw, isForceSync),
      ...this._collect("content", await this._db.content.all(), isForceSync),
      ...this._collect(
        "attachment",
        this._db.attachments.syncable,
        isForceSync
      ),
      ...this._collect("settings", [this._db.settings.raw], isForceSync),
    ];

    return { items, vaultKey: await this._db.vault._getKey() };
  }

  _serialize(item) {
    if (!item) return null;
    return this._db.storage.encrypt(this.key, JSON.stringify(item));
  }

  encrypt(array) {
    if (!array.length) return [];
    return Promise.all(array.map(this._map, this));
  }

  /**
   *
   * @param {Array} array
   * @returns {Array}
   */
  _collect(type, array, isForceSync) {
    if (!array.length) return [];

    const result = array.reduce((prev, item) => {
      if (!item) return prev;

      const isSyncable = !item.synced || isForceSync;
      const isUnsynced =
        item.dateModified > this._lastSyncedTimestamp || isForceSync;

      if (item.localOnly) {
        prev.push({
          id: item.id,
          type,
          deleted: true,
          dateModified: Date.now(),
        });
      } else if (isUnsynced && isSyncable) {
        prev.push({ ...item, type });
      }

      return prev;
    }, []);
    this.logger.info(
      `Collected items: ${type} (${result.length}/${array.length})`
    );
    return result;
  }

  // _map(item) {
  //   return {
  //     id: item.id,
  //     v: CURRENT_DATABASE_VERSION,
  //     iv: item.iv,
  //     cipher: item.cipher,
  //     length: item.length,
  //     alg: item.alg,
  //     dateModified: item.dateModified,
  //   };
  // }

  async _map(item) {
    // in case of resolved content
    delete item.resolved;
    // synced is a local only property
    delete item.synced;

    return {
      id: item.id,
      v: CURRENT_DATABASE_VERSION,
      ...(await this._serialize(item)),
    };
  }

  filter(data, predicate) {
    const arrays = ["notes", "notebooks", "content", "attachments", "settings"];
    const newData = {};
    for (let array of arrays) {
      if (!data[array]) continue;
      this.logger.info(`Filtering from ${data[array].length} ${array}`);
      newData[array] = data[array].filter(predicate);
      this.logger.info(
        `Length after filtering ${array}: ${newData[array].length}`
      );
    }
    return newData;
  }
}
export default Collector;

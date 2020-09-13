export default class Backup {
  /**
   *
   * @param {import("../api/index.js").default} db
   */
  constructor(db) {
    this._db = db;
  }

  async export(encrypt = false) {
    const keys = await this._db.context.getAllKeys();
    const db = Object.fromEntries(await this._db.context.readMulti(keys));
    if (encrypt) {
      const key = await this._db.user.key();
      return JSON.stringify(
        await this._db.context.encrypt(key, JSON.stringify(db))
      );
    }
    return JSON.stringify(db);
  }

  async import(data) {
    let backup = JSON.parse(data);
    //check if we have encrypted data
    if (backup.salt && backup.iv) {
      const key = await this._db.user.key();
      backup = JSON.parse(await this._db.context.decrypt(key, backup));
    }
    for (let key in backup) {
      let value = backup[key];
      await this._db.context.write(key, value);
    }
  }
}

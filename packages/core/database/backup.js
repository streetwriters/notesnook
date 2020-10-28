import Hashes from "jshashes";
const md5 = new Hashes.MD5();

const invalidKeys = ["user", "t", "lastBackupTime"];
const validTypes = ["mobile", "web", "node"];
export default class Backup {
  /**
   *
   * @param {import("../api/index.js").default} db
   */
  constructor(db) {
    this._db = db;
  }

  lastBackupTime() {
    return this._db.context.read("lastBackupTime");
  }

  /**
   *
   * @param {"web"|"mobile"|"node"} type
   * @param {boolean} encrypt
   */
  async export(type, encrypt = false) {
    if (!validTypes.some((t) => t === type))
      throw new Error("Invalid type. It must be one of 'mobile' or 'web'.");

    const keys = (await this._db.context.getAllKeys()).filter(
      (key) => !invalidKeys.some((t) => t === key)
    );

    const db = Object.fromEntries(await this._db.context.readMulti(keys));
    db.h = md5.hex(JSON.stringify(db));

    if (encrypt) {
      const key = await this._db.user.key();
      return JSON.stringify({
        type,
        date: Date.now(),
        data: await this._db.context.encrypt(key, JSON.stringify(db)),
      });
    }

    // save backup time
    await this._db.context.write("lastBackupTime", Date.now());

    return JSON.stringify({
      type,
      date: Date.now(),
      data: db,
    });
  }

  /**
   *
   * @param {string} data the backup data
   */
  async import(data) {
    if (!data) return;

    let backup = JSON.parse(data);

    if (!this._validate(backup)) throw new Error("Invalid backup.");

    let db = backup.data;
    //check if we have encrypted data
    if (db.salt && db.iv) {
      const key = await this._db.user.key();
      db = JSON.parse(await this._db.context.decrypt(key, db));
    }

    if (!this._verify(db))
      throw new Error("Backup file has been tempered, aborting...");

    for (let key in db) {
      let value = db[key];
      await this._db.context.write(key, value);
    }
  }

  _validate(backup) {
    return (
      !!backup.date &&
      !!backup.data &&
      !!backup.type &&
      validTypes.some((t) => t === backup.type)
    );
  }

  _verify(db) {
    const hash = db.h;
    delete db.h;
    return hash == md5.hex(JSON.stringify(db));
  }
}

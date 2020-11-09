import SparkMD5 from "spark-md5";

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

    let data = Object.fromEntries(await this._db.context.readMulti(keys));

    if (encrypt) {
      const key = await this._db.user.key();
      data = await this._db.context.encrypt(key, JSON.stringify(data));
    }

    // save backup time
    await this._db.context.write("lastBackupTime", Date.now());

    return JSON.stringify({
      version: 2,
      type,
      date: Date.now(),
      data,
      hash: SparkMD5.hash(JSON.stringify(data)),
      hash_type: "spark-md5",
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

    if (!this._verify(backup))
      throw new Error("Backup file has been tempered, aborting...");
    // TODO add a proper restoration system.
    // for (let key in db) {
    //   let value = db[key];
    //   if (value && value.dateEdited) {
    //     value.dateEdited = Date.now();
    //   }

    //   const oldValue = await this._db.context.read(oldValue);

    //   let finalValue = oldValue || value;
    //   if (typeof value === "object") {
    //     finalValue = Array.isArray(value)
    //       ? [...value, ...oldValue]
    //       : { ...value, ...oldValue };
    //   }

    //   await this._db.context.write(key, finalValue);
    // }
  }

  _validate(backup) {
    return (
      !!backup.date &&
      !!backup.data &&
      !!backup.type &&
      validTypes.some((t) => t === backup.type)
    );
  }

  _verify(backup) {
    const { hash, hash_type, data: db } = backup;
    switch (hash_type) {
      case "spark-md5": {
        return hash === SparkMD5.hash(JSON.stringify(db));
      }
      default: {
        return false;
      }
    }
  }
}

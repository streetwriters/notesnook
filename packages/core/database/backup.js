import { MD5 } from "jshashes";
import Migrator from "./migrator.js";
import {
  CHECK_IDS,
  sendCheckUserStatusEvent,
  CURRENT_DATABASE_VERSION,
} from "../common.js";
const md5 = new MD5();

const invalidKeys = ["user", "t", "lastBackupTime"];
const validTypes = ["mobile", "web", "node"];
export default class Backup {
  /**
   *
   * @param {import("../api/index.js").default} db
   */
  constructor(db) {
    this._db = db;
    this._migrator = new Migrator();
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
    if (encrypt && !(await sendCheckUserStatusEvent(CHECK_IDS.backupEncrypt)))
      return;

    if (!validTypes.some((t) => t === type))
      throw new Error("Invalid type. It must be one of 'mobile' or 'web'.");

    const keys = (await this._db.context.getAllKeys()).filter(
      (key) => !invalidKeys.some((t) => t === key)
    );

    let data = Object.fromEntries(await this._db.context.readMulti(keys));

    if (encrypt) {
      const key = await this._db.user.getEncryptionKey();
      data = await this._db.context.encrypt(key, JSON.stringify(data));
    }

    // save backup time
    await this._db.context.write("lastBackupTime", Date.now());

    return JSON.stringify({
      version: CURRENT_DATABASE_VERSION,
      type,
      date: Date.now(),
      data,
      hash: md5.hex(JSON.stringify(data)),
      hash_type: "md5",
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

    backup = this._migrateBackup(backup);

    let db = backup.data;
    //check if we have encrypted data
    if (db.salt && db.iv) {
      const key = await this._db.user.getEncryptionKey();
      db = JSON.parse(await this._db.context.decrypt(key, db));
    }

    if (!this._verify(backup))
      throw new Error("Backup file has been tempered, aborting...");

    await this._migrateData(backup);
  }

  _migrateBackup(backup) {
    const { version = 0 } = backup;
    if (version > CURRENT_DATABASE_VERSION)
      throw new Error(
        "This backup was made from a newer version of Notesnook. Cannot migrate."
      );

    switch (version) {
      case CURRENT_DATABASE_VERSION:
      case 4:
      case 4.1:
      case 4.2:
      case 4.3:
      case 3:
      case 2: {
        return backup;
      }
      case 0: {
        const hash = backup.data.h;
        const hash_type = backup.data.ht;
        delete backup.data.h;
        delete backup.data.ht;
        return {
          version: 0,
          type: backup.type,
          date: backup.date || Date.now(),
          data: backup.data,
          hash,
          hash_type,
        };
      }
      default:
        throw new Error("Unknown backup version.");
    }
  }

  async _migrateData(backup) {
    const { data, version = 0 } = backup;

    if (version > CURRENT_DATABASE_VERSION)
      throw new Error(
        "This backup was made from a newer version of Notesnook. Cannot migrate."
      );

    const collections = [
      {
        index: data["notes"],
        dbCollection: this._db.notes,
      },
      {
        index: data["notebooks"],
        dbCollection: this._db.notebooks,
      },
      {
        index: data["trash"],
        dbCollection: this._db.trash,
      },
      {
        index: data["delta"],
        dbCollection: this._db.content,
        type: "delta",
      },
      {
        index: data["content"],
        dbCollection: this._db.content,
      },
      {
        index: ["settings"],
        dbCollection: this._db.settings,
        type: "settings",
      },
    ];

    await this._migrator.migrate(collections, (id) => data[id], version);
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
      case "md5": {
        return hash === md5.hex(JSON.stringify(db));
      }
      default: {
        return false;
      }
    }
  }
}

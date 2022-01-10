import Migrator from "./migrator.js";
import {
  CHECK_IDS,
  checkIsUserPremium,
  CURRENT_DATABASE_VERSION,
} from "../common.js";
import SparkMD5 from "spark-md5";

const invalidKeys = ["user", "t", "v", "lastBackupTime", "lastSynced"];
const invalidIndices = ["tags", "colors"];
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
    return this._db.storage.read("lastBackupTime");
  }

  /**
   *
   * @param {"web"|"mobile"|"node"} type
   * @param {boolean} encrypt
   */
  async export(type, encrypt = false) {
    if (encrypt && !(await checkIsUserPremium(CHECK_IDS.backupEncrypt))) return;

    if (!validTypes.some((t) => t === type))
      throw new Error("Invalid type. It must be one of 'mobile' or 'web'.");

    let keys = await this._db.storage.getAllKeys();
    let data = filterData(
      Object.fromEntries(await this._db.storage.readMulti(keys))
    );

    let hash = {};

    if (encrypt) {
      const key = await this._db.user.getEncryptionKey();
      data = await this._db.storage.encrypt(key, JSON.stringify(data));
    } else {
      hash = { hash: SparkMD5.hash(JSON.stringify(data)), hash_type: "md5" };
    }

    // save backup time
    await this._db.storage.write("lastBackupTime", Date.now());
    return JSON.stringify({
      version: CURRENT_DATABASE_VERSION,
      type,
      date: Date.now(),
      data,
      ...hash,
    });
  }

  /**
   *
   * @param {any} backup the backup data
   */
  async import(backup, password) {
    if (!backup) return;

    if (!this._validate(backup)) throw new Error("Invalid backup.");

    backup = this._migrateBackup(backup);

    let db = backup.data;
    const isEncrypted = db.salt && db.iv && db.cipher;
    if (isEncrypted) {
      if (!password)
        throw new Error(
          "Please provide a password to decrypt this backup & restore it."
        );

      const key = await this._db.storage.generateCryptoKey(password, db.salt);
      if (!key)
        throw new Error("Could not generate encryption key for backup.");

      try {
        const decrypted = await this._db.storage.decrypt(key, db);
        backup.data = JSON.parse(decrypted);
      } catch (e) {
        if (
          e.message.includes("ciphertext cannot be decrypted") ||
          e.message === "FAILURE"
        )
          throw new Error("Incorrect password.");

        throw new Error(`Could not decrypt backup: ${e.message}`);
      }
    } else if (!this._verify(backup))
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
      case 5.3:
      case 5.2:
      case 5.1:
      case 5.0: {
        return backup;
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

    // we have to reindex to make sure we handle all the items
    // properly.
    reindex(data);
    const collections = [
      {
        index: data["attachments"],
        dbCollection: this._db.attachments,
      },
      {
        index: data["notebooks"],
        dbCollection: this._db.notebooks,
      },
      {
        index: data["content"],
        dbCollection: this._db.content,
      },
      {
        index: data["notes"],
        dbCollection: this._db.notes,
      },
      {
        index: ["settings"],
        dbCollection: this._db.settings,
        type: "settings",
      },
    ];

    await this._db.syncer.acquireLock(async () => {
      if (
        await this._migrator.migrate(collections, (id) => data[id], version)
      ) {
        await this._db.notes.repairReferences();
        await this._db.notebooks.repairReferences();
      }
    });
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
        return hash === SparkMD5.hash(JSON.stringify(db));
      }
      default: {
        return false;
      }
    }
  }
}

function filterData(data) {
  let skippedKeys = [...invalidKeys, ...invalidIndices];
  invalidIndices.forEach((key) => {
    const index = data[key];
    if (!index) return;
    skippedKeys.push(...index);
  });

  skippedKeys.forEach((key) => delete data[key]);
  return data;
}

function reindex(data) {
  for (let key in data) {
    const item = data[key];
    if (!item) {
      delete data[key];
      continue;
    }
    switch (item.type) {
      case "notebook":
        if (!data["notebooks"]) data["notebooks"] = [];
        data["notebooks"].push(item.id);
        break;
      case "note":
        if (!data["notes"]) data["notes"] = [];
        data["notes"].push(item.id);
        break;
      case "content":
        if (!data["content"]) data["content"] = [];
        data["content"].push(item.id);
        break;
    }
  }
}

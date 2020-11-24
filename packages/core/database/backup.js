import Hashes from "jshashes";
import { sendCheckUserStatusEvent } from "../common.js";
const md5 = new Hashes.MD5();

const invalidKeys = ["user", "t", "lastBackupTime"];
const validTypes = ["mobile", "web", "node"];
const CURRENT_BACKUP_VERSION = 2;
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
    if (encrypt && !(await sendCheckUserStatusEvent("backup:encrypt"))) return;

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
      version: CURRENT_BACKUP_VERSION,
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
      const key = await this._db.user.key();
      db = JSON.parse(await this._db.context.decrypt(key, db));
    }

    if (!this._verify(backup))
      throw new Error("Backup file has been tempered, aborting...");

    await this._migrateData(backup);
  }

  _migrateBackup(backup) {
    const { version = 0 } = backup;
    if (version > CURRENT_BACKUP_VERSION)
      throw new Error(
        "This backup was made from a newer version of Notesnook. Cannot migrate."
      );

    switch (version) {
      case CURRENT_BACKUP_VERSION: {
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
    if (version > CURRENT_BACKUP_VERSION)
      throw new Error(
        "This backup was made from a newer version of Notesnook. Cannot migrate."
      );

    const collections = [
      "notes",
      "notebooks",
      "tags",
      "colors",
      "trash",
      "delta",
      "text",
      "content",
    ];

    await Promise.all(
      collections.map(async (collection) => {
        const collectionIndex = data[collection];
        if (!collectionIndex) return;
        await Promise.all(
          collectionIndex.map(async (id) => {
            const item = data[id];
            if (!item) return;
            await migrations[version][collection](this._db, item);
          })
        );
      })
    );
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

const migrations = {
  handleDeleted: async function (db, collection, item) {
    if (item.deleted) {
      await db[collection]._collection.addItem(item);
      return true;
    }
    return false;
  },
  0: {
    notes: async function (db, item) {
      if (await migrations.handleDeleted(db, "notes", item)) return;

      const contentId = item.content.delta;
      delete item.content;
      item.contentId = contentId;
      item.remote = true;
      if (!item.notebook.id) item.notebook = undefined;
      await db.notes.add(item);
    },
    delta: async function (db, item) {
      if (await migrations.handleDeleted(db, "content", item)) return;

      item.data = item.data.ops;
      item.type = "delta";
      await db.content.add(item);
    },
    trash: async function (db, item) {
      if (await migrations.handleDeleted(db, "trash", item)) return;

      item.itemType = item.type;
      item.type = "trash";
      if (item.itemType === "note") {
        item.contentId = item.content.delta;
        delete item.content;
      }
      await db.trash.add(item);
    },
    notebooks: async function (db, item) {
      if (await migrations.handleDeleted(db, "notebooks", item)) return;
      await db.notebooks.add(item);
    },
    tags: async function (db, item) {
      if (await migrations.handleDeleted(db, "tags", item)) return;
      await db.tags.add(item);
    },
    colors: async function (db, item) {
      if (await migrations.handleDeleted(db, "colors", item)) return;
      await db.tags.add(item);
    },
    text: function () {},
  },
  2: {
    notes: async function (db, item) {
      if (await migrations.handleDeleted(db, "notes", item)) return;
      await db.notes.add({ ...item, remote: true });
    },
    notebooks: async function (db, item) {
      if (await migrations.handleDeleted(db, "notebooks", item)) return;
      await db.notebooks.add(item);
    },
    tags: async function (db, item) {
      if (await migrations.handleDeleted(db, "tags", item)) return;
      await db.tags.add(item);
    },
    colors: async function (db, item) {
      if (await migrations.handleDeleted(db, "colors", item)) return;
      await db.tags.add(item);
    },
    trash: async function (db, item) {
      if (await migrations.handleDeleted(db, "trash", item)) return;
      await db.trash.add(item);
    },
    content: async function (db, item) {
      if (await migrations.handleDeleted(db, "content", item)) return;
      await db.content.add(item);
    },
  },
};

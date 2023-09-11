/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import SparkMD5 from "spark-md5";
import { CURRENT_DATABASE_VERSION } from "../common.js";
import Migrator from "./migrator.js";

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

  async updateBackupTime() {
    await this._db.storage.write("lastBackupTime", Date.now());
  }
  /**
   *
   * @param {"web"|"mobile"|"node"} type
   * @param {boolean} encrypt
   */
  async export(type, encrypt = false) {
    if (!validTypes.some((t) => t === type))
      throw new Error("Invalid type. It must be one of 'mobile' or 'web'.");
    if (encrypt && !(await this._db.user.getUser()))
      throw new Error("Please login to create encrypted backups.");

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
    await this.updateBackupTime();
    return JSON.stringify({
      version: CURRENT_DATABASE_VERSION,
      type,
      date: Date.now(),
      data,
      ...hash
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
      case 5.8:
      case 5.7:
      case 5.6:
      case 5.5:
      case 5.4:
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

    const collections = [
      {
        index: () => data["attachments"],
        dbCollection: this._db.attachments
      },
      {
        index: () => data["notebooks"],
        dbCollection: this._db.notebooks
      },
      {
        index: () => data["content"],
        dbCollection: this._db.content
      },
      {
        index: () => data["shortcuts"],
        dbCollection: this._db.shortcuts
      },
      {
        index: () => data["reminders"],
        dbCollection: this._db.reminders
      },
      {
        index: () => data["relations"],
        dbCollection: this._db.relations
      },
      {
        index: () => data["notehistory"],
        dbCollection: this._db.noteHistory,
        type: "notehistory"
      },
      {
        index: () => data["sessioncontent"],
        dbCollection: this._db.noteHistory.sessionContent,
        type: "sessioncontent"
      },
      {
        index: () => data["notes"],
        dbCollection: this._db.notes
      },
      {
        index: () => ["settings"],
        dbCollection: this._db.settings,
        type: "settings"
      }
    ];

    await this._db.syncer.acquireLock(async () => {
      await this._migrator.migrate(
        this._db,
        collections,
        (id, type) => (version < 5.8 ? data[id] : data[`${id}_${type}`]),
        version,
        true
      );
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

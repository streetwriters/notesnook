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
import { toChunks } from "../utils/array.js";
import { migrateItem } from "../migrations.js";
import Indexer from "./indexer.js";
import setManipulator from "../utils/set.js";

const COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "gray",
  "black",
  "white"
];

const invalidKeys = [
  "user",
  "t",
  "v",
  "lastBackupTime",
  "lastSynced",
  // all indexes
  "notes",
  "notebooks",
  "content",
  "tags",
  "colors",
  "attachments",
  "relations",
  "reminders",
  "sessioncontent",
  "notehistory",
  "shortcuts",
  "vaultKey",
  "hasConflict",
  "token",
  "monographs"
];

const itemTypeToCollectionKey = {
  note: "notes",
  notebook: "notebooks",
  tiptap: "content",
  tiny: "content",
  tag: "tags",
  color: "colors",
  attachment: "attachments",
  relation: "relations",
  reminder: "reminders",
  sessioncontent: "sessioncontent",
  session: "notehistory",
  notehistory: "notehistory",
  content: "content",
  shortcut: "shortcuts"
};

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
  async *export(type, encrypt = false) {
    if (!validTypes.some((t) => t === type))
      throw new Error("Invalid type. It must be one of 'mobile' or 'web'.");
    if (encrypt && !(await this._db.user.getUser()))
      throw new Error("Please login to create encrypted backups.");

    yield {
      path: ".nnbackup",
      data: ""
    };

    let keys = await this._db.storage.getAllKeys();
    const key = await this._db.user.getEncryptionKey();
    const chunks = toChunks(keys, 20);
    let buffer = [];
    let bufferLength = 0;
    const MAX_CHUNK_SIZE = 10 * 1024 * 1024;
    let chunkIndex = 0;

    while (chunks.length > 0) {
      const chunk = chunks.pop();

      const items = await this._db.storage.readMulti(chunk);
      items.forEach(([id, item]) => {
        if (
          !item ||
          invalidKeys.includes(id) ||
          (item.deleted && !item.type) ||
          id.startsWith("_uk_")
        )
          return;

        const data = JSON.stringify(item);
        buffer.push(data);
        bufferLength += data.length;
      });

      if (bufferLength >= MAX_CHUNK_SIZE || chunks.length === 0) {
        let itemsJSON = `[${buffer.join(",")}]`;

        buffer = [];
        bufferLength = 0;

        itemsJSON = await this._db.compressor.compress(itemsJSON);

        const hash = SparkMD5.hash(itemsJSON);

        if (encrypt) itemsJSON = await this._db.storage.encrypt(key, itemsJSON);

        yield {
          path: `${chunkIndex++}-${encrypt ? "encrypted" : "plain"}-${hash}`,
          data: `{
"version": ${CURRENT_DATABASE_VERSION},
"type": "${type}",
"date": ${Date.now()},
"data": ${JSON.stringify(itemsJSON)},
"hash": "${hash}",
"hash_type": "md5",
"compressed": true,
"encrypted": ${encrypt ? "true" : "false"}
}`
        };
      }
    }

    if (bufferLength > 0 || buffer.length > 0)
      throw new Error("Buffer not empty.");

    await this.updateBackupTime();
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
    if (backup.encrypted || isEncrypted) {
      if (!password)
        throw new Error(
          "Please provide a password to decrypt this backup & restore it."
        );

      const key = await this._db.storage.generateCryptoKey(password, db.salt);
      if (!key)
        throw new Error("Could not generate encryption key for backup.");

      try {
        backup.data = await this._db.storage.decrypt(key, db);
      } catch (e) {
        if (
          e.message.includes("ciphertext cannot be decrypted") ||
          e.message === "FAILURE"
        )
          throw new Error("Incorrect password.");

        throw new Error(`Could not decrypt backup: ${e.message}`);
      }
    }

    if (backup.hash && !this._verify(backup))
      throw new Error("Backup file has been tempered, aborting...");

    if (backup.compressed)
      backup.data = await this._db.compressor.decompress(backup.data);
    backup.data =
      typeof backup.data === "string" ? JSON.parse(backup.data) : backup.data;

    await this._migrateData(backup);
  }

  _migrateBackup(backup) {
    const { version = 0 } = backup;
    if (version > CURRENT_DATABASE_VERSION)
      throw new Error(
        "This backup was made from a newer version of Notesnook. Cannot restore."
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

    const toAdd = {};
    for (let item of Array.isArray(data) ? data : Object.values(data)) {
      // we do not want to restore deleted items
      if (!item || (!item.type && item.deleted) || typeof item !== "object")
        continue;
      // in v5.6 of the database, we did not set note history session's type
      if (!item.type && item.sessionContentId) item.type = "notehistory";

      await migrateItem(item, version, item.type, this._db, "backup");
      // since items in trash can have their own set of migrations,
      // we have to run the migration again to account for that.
      if (item.type === "trash" && item.itemType)
        await migrateItem(item, version, item.itemType, this._db, "backup");

      // colors are naively of type "tag" instead of "color" so we have to fix that.
      const itemType =
        item.type === "tag" && COLORS.includes(item.title.toLowerCase())
          ? "color"
          : item.itemType || item.type;

      // items should sync immediately after getting restored
      item.dateModified = Date.now();
      item.synced = false;

      if (itemType === "attachment" && item.metadata && item.metadata.hash) {
        const attachment = this._db.attachments.attachment(item.metadata.hash);
        if (attachment) {
          item = {
            ...attachment,
            metadata: {
              ...attachment.metadata,
              type: item.metadata.type || attachment.metadata.type
            },
            noteIds: setManipulator.union(attachment.noteIds, item.noteIds)
          };
        } else {
          item.dateUploaded = undefined;
          item.failed = undefined;
        }
      }

      const collectionKey = itemTypeToCollectionKey[itemType];
      if (collectionKey) {
        toAdd[collectionKey] = toAdd[collectionKey] || [];
        toAdd[collectionKey].push([item.id, item]);
      } else if (item.type === "settings")
        await this._db.storage.write("settings", item);
    }

    for (const collectionKey in toAdd) {
      const indexer = new Indexer(this._db.storage, collectionKey);
      await indexer.init();
      await indexer.writeMulti(toAdd[collectionKey]);
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

  _verify(backup) {
    const { compressed, hash, hash_type, data: db } = backup;
    switch (hash_type) {
      case "md5": {
        return hash === SparkMD5.hash(compressed ? db : JSON.stringify(db));
      }
      default: {
        return false;
      }
    }
  }
}

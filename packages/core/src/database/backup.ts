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
import Database from "../api/index.js";
import {
  Item,
  MaybeDeletedItem,
  Note,
  Notebook,
  ValueOf,
  isDeleted
} from "../types.js";
import { Cipher } from "@notesnook/crypto";
import { isCipher } from "./crypto.js";
import { toChunks } from "../utils/array";
import { migrateItem } from "../migrations";
import Indexer from "./indexer";
import { set } from "../utils/set.js";

type BackupDataItem = MaybeDeletedItem<Item> | string[];
type BackupPlatform = "web" | "mobile" | "node";
type BaseBackupFile = {
  version: number;
  type: BackupPlatform;
  date: number;
  // encrypted?: boolean;
  // compressed?: boolean;
};
type LegacyUnencryptedBackupFile = BaseBackupFile & {
  data: Record<string, BackupDataItem> | string;
  hash: string;
  hash_type: "md5";
};

type LegacyEncryptedBackupFile = BaseBackupFile & {
  data: Cipher<"base64">;
};

type UnencryptedBackupFile = BaseBackupFile & {
  data: string;
  hash: string;
  hash_type: "md5";
  compressed: true;
  encrypted: false;
};

type EncryptedBackupFile = BaseBackupFile & {
  data: Cipher<"base64">;
  hash: string;
  hash_type: "md5";
  compressed: true;
  encrypted: true;
};

type BackupFile = UnencryptedBackupFile | EncryptedBackupFile;
type LegacyBackupFile = LegacyUnencryptedBackupFile | LegacyEncryptedBackupFile;

function isEncryptedBackup(
  backup: LegacyBackupFile | BackupFile
): backup is EncryptedBackupFile | LegacyEncryptedBackupFile {
  return "encrypted" in backup ? backup.encrypted : isCipher(backup.data);
}

function isLegacyBackupFile(
  backup: LegacyBackupFile | BackupFile
): backup is LegacyBackupFile {
  return backup.version <= 5.8;
}

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
  shortcut: "shortcuts",

  // to make ts happy
  topic: "topics"
} as const;

const validTypes = ["mobile", "web", "node"];
export default class Backup {
  migrator = new Migrator();
  constructor(private readonly db: Database) {}

  lastBackupTime() {
    return this.db.storage().read("lastBackupTime");
  }

  async updateBackupTime() {
    await this.db.storage().write("lastBackupTime", Date.now());
  }

  async *export(type: BackupPlatform, encrypt = false) {
    if (!validTypes.some((t) => t === type))
      throw new Error("Invalid type. It must be one of 'mobile' or 'web'.");
    if (encrypt && !(await this.db.user.getUser()))
      throw new Error("Please login to create encrypted backups.");

    const key = await this.db.user.getEncryptionKey();
    if (encrypt && !key) throw new Error("No encryption key found.");

    yield {
      path: ".nnbackup",
      data: ""
    };

    const keys = await this.db.storage().getAllKeys();
    const chunks = toChunks(keys, 20);
    let buffer: string[] = [];
    let bufferLength = 0;
    const MAX_CHUNK_SIZE = 10 * 1024 * 1024;
    let chunkIndex = 0;

    while (chunks.length > 0) {
      const chunk = chunks.pop();

      const items = await this.db.storage().readMulti(chunk);
      items.forEach(([id, item]) => {
        const isDeleted =
          item &&
          typeof item === "object" &&
          "deleted" in item &&
          !("type" in item);

        if (
          !item ||
          invalidKeys.includes(id) ||
          isDeleted ||
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

        itemsJSON = await this.db.compressor().compress(itemsJSON);

        const hash = SparkMD5.hash(itemsJSON);

        if (encrypt && key)
          itemsJSON = JSON.stringify(
            await this.db.storage().encrypt(key, itemsJSON)
          );
        else itemsJSON = JSON.stringify(itemsJSON);

        yield {
          path: `${chunkIndex++}-${encrypt ? "encrypted" : "plain"}-${hash}`,
          data: `{
  "version": ${CURRENT_DATABASE_VERSION},
  "type": "${type}",
  "date": ${Date.now()},
  "data": ${itemsJSON},
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

  async import(
    backup: LegacyBackupFile | BackupFile,
    password?: string,
    encryptionKey?: string
  ) {
    if (!this.validate(backup)) throw new Error("Invalid backup.");

    backup = this.migrateBackup(backup);

    let decryptedData: string | Record<string, BackupDataItem> | undefined =
      undefined;
    if (isEncryptedBackup(backup)) {
      if (!password && !encryptionKey)
        throw new Error(
          "Please provide a password to decrypt this backup & restore it."
        );

      const key = encryptionKey
        ? { key: encryptionKey, salt: backup.data.salt }
        : password
        ? await this.db.storage().generateCryptoKey(password, backup.data.salt)
        : undefined;
      if (!key)
        throw new Error("Could not generate encryption key for backup.");

      try {
        decryptedData = await this.db.storage().decrypt(key, backup.data);
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          if (
            e.message.includes("ciphertext cannot be decrypted") ||
            e.message === "FAILURE"
          )
            throw new Error("Incorrect password.");
          throw new Error(`Could not decrypt backup: ${e.message}`);
        }
      }
    } else {
      decryptedData = backup.data;
    }

    if (!decryptedData) return;

    if ("hash" in backup && !this.verify(backup))
      throw new Error("Backup file has been tempered, aborting...");

    if ("compressed" in backup && typeof decryptedData === "string")
      decryptedData = await this.db.compressor().decompress(decryptedData);

    await this.migrateData(
      typeof decryptedData === "string"
        ? (JSON.parse(decryptedData) as BackupDataItem[])
        : Object.values(decryptedData),
      backup.version
    );
  }

  private migrateBackup(backup: BackupFile | LegacyBackupFile) {
    const { version = 0 } = backup;
    if (version > CURRENT_DATABASE_VERSION)
      throw new Error(
        "This backup was made from a newer version of Notesnook. Cannot migrate."
      );

    switch (version) {
      case CURRENT_DATABASE_VERSION:
      case 5.9:
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

  private async migrateData(data: BackupDataItem[], version: number) {
    const toAdd: Partial<
      Record<
        ValueOf<typeof itemTypeToCollectionKey>,
        [string, MaybeDeletedItem<Item>][]
      >
    > = {};
    for (let item of data) {
      // we do not want to restore deleted items
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        isDeleted(item)
      )
        continue;
      // in v5.6 of the database, we did not set note history session's type
      if ("sessionContentId" in item && item.type !== "session")
        (item as any).type = "notehistory";

      // colors are naively of type "tag" instead of "color" so we have to fix that.
      if (item.type === "tag" && COLORS.includes(item.title.toLowerCase()))
        (item as any).type = "color";

      await migrateItem(item, version, item.type, this.db, "backup");
      // since items in trash can have their own set of migrations,
      // we have to run the migration again to account for that.
      if (item.type === "trash" && item.itemType)
        await migrateItem(
          item as unknown as Note | Notebook,
          version,
          item.itemType,
          this.db,
          "backup"
        );

      if (item.type === "attachment" && item.metadata && item.metadata.hash) {
        const attachment = this.db.attachments.attachment(item.metadata.hash);
        if (attachment) {
          const isNewGeneric =
            item.metadata.type === "application/octet-stream";
          const isOldGeneric =
            attachment.metadata.type === "application/octet-stream";
          item = {
            ...attachment,
            metadata: {
              ...attachment.metadata,
              type:
                // we keep whichever mime type is more specific
                isNewGeneric && !isOldGeneric
                  ? attachment.metadata.type
                  : item.metadata.type,
              filename:
                // we keep the filename based on which item's mime type we kept
                isNewGeneric && !isOldGeneric
                  ? attachment.metadata.filename
                  : item.metadata.filename
            },
            noteIds: set.union(attachment.noteIds, item.noteIds)
          };
        } else {
          item.dateUploaded = undefined;
          item.failed = undefined;
        }
      }

      // items should sync immediately after getting restored
      item.dateModified = Date.now();
      item.synced = false;

      if (item.type === "settings")
        await this.db.storage().write("settings", item);
      else {
        const itemType = "itemType" in item ? item.itemType : item.type;
        const collectionKey = itemTypeToCollectionKey[itemType];
        if (collectionKey) {
          toAdd[collectionKey] = toAdd[collectionKey] || [];
          toAdd[collectionKey]?.push([item.id, item]);
        }
      }
    }

    for (const collectionKey in toAdd) {
      const items =
        toAdd[collectionKey as ValueOf<typeof itemTypeToCollectionKey>];
      if (!items) continue;
      const indexer = new Indexer(this.db.storage, collectionKey);
      await indexer.init();
      await indexer.writeMulti(items);
    }
  }

  private validate(backup: LegacyBackupFile | BackupFile) {
    return (
      !!backup.date &&
      !!backup.data &&
      !!backup.type &&
      validTypes.some((t) => t === backup.type)
    );
  }

  private verify(backup: BackupFile | LegacyUnencryptedBackupFile) {
    const { hash, hash_type, data } = backup;
    switch (hash_type) {
      case "md5": {
        return (
          hash ===
          SparkMD5.hash(
            "compressed" in backup && backup.compressed
              ? data
              : JSON.stringify(data)
          )
        );
      }
      default: {
        return false;
      }
    }
  }
}

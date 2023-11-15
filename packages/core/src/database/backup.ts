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
import { Item, MaybeDeletedItem, Note, Notebook, isDeleted } from "../types.js";
import { Cipher, SerializedKey } from "@notesnook/crypto";
import { isCipher } from "./crypto.js";
import { migrateItem } from "../migrations";
import { DatabaseCollection } from "./index.js";

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

type BackupState = {
  buffer: string[];
  bufferLength: number;
  chunkIndex: number;
  key?: SerializedKey;
  encrypt: boolean;
  type: BackupPlatform;
};

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

const MAX_CHUNK_SIZE = 10 * 1024 * 1024;
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
  session: "noteHistory",
  notehistory: "notehistory",
  content: "content",
  shortcut: "shortcuts",
  settingitem: "settings",
  settings: "settings",

  // to make ts happy
  topic: "topics"
} as const;

const validTypes = ["mobile", "web", "node"];
export default class Backup {
  migrator = new Migrator();
  constructor(private readonly db: Database) {}

  lastBackupTime() {
    return this.db.storage().read<number>("lastBackupTime");
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

    const backupState: BackupState = {
      buffer: [] as string[],
      bufferLength: 0,
      chunkIndex: 0,
      key,
      encrypt,
      type
    };

    yield* this.backupCollection(this.db.notes.collection, backupState);
    yield* this.backupCollection(this.db.notebooks.collection, backupState);
    yield* this.backupCollection(this.db.content.collection, backupState);
    yield* this.backupCollection(this.db.noteHistory.collection, backupState);
    yield* this.backupCollection(
      this.db.noteHistory.sessionContent.collection,
      backupState
    );
    yield* this.backupCollection(this.db.colors.collection, backupState);
    yield* this.backupCollection(this.db.tags.collection, backupState);
    yield* this.backupCollection(this.db.settings.collection, backupState);
    yield* this.backupCollection(this.db.shortcuts.collection, backupState);
    yield* this.backupCollection(this.db.reminders.collection, backupState);
    yield* this.backupCollection(this.db.relations.collection, backupState);
    yield* this.backupCollection(this.db.attachments.collection, backupState);

    if (backupState.buffer.length > 0) yield* this.bufferToFile(backupState);

    await this.updateBackupTime();
  }

  private async *backupCollection<T, B extends boolean>(
    collection: DatabaseCollection<T, B>,
    state: BackupState
  ) {
    for await (const item of collection.stream() as any) {
      const data = JSON.stringify(item);
      state.buffer.push(data);
      state.bufferLength += data.length;

      if (state.bufferLength >= MAX_CHUNK_SIZE) {
        yield* this.bufferToFile(state);
      }
    }
  }

  private async *bufferToFile(state: BackupState) {
    let itemsJSON = `[${state.buffer.join(",")}]`;

    state.buffer = [];
    state.bufferLength = 0;

    itemsJSON = await this.db.compressor().compress(itemsJSON);

    const hash = SparkMD5.hash(itemsJSON);

    if (state.encrypt && state.key)
      itemsJSON = JSON.stringify(
        await this.db.storage().encrypt(state.key, itemsJSON)
      );
    else itemsJSON = JSON.stringify(itemsJSON);

    yield {
      path: `${state.chunkIndex++}-${
        state.encrypt ? "encrypted" : "plain"
      }-${hash}`,
      data: `{
"version": ${CURRENT_DATABASE_VERSION},
"type": "${state.type}",
"date": ${Date.now()},
"data": ${itemsJSON},
"hash": "${hash}",
"hash_type": "md5",
"compressed": true,
"encrypted": ${state.encrypt ? "true" : "false"}
}`
    };
  }

  async import(backup: LegacyBackupFile | BackupFile, password?: string) {
    if (!this.validate(backup)) throw new Error("Invalid backup.");

    backup = this.migrateBackup(backup);

    let decryptedData: string | Record<string, BackupDataItem> | undefined =
      undefined;
    if (isEncryptedBackup(backup)) {
      if (!password)
        throw new Error(
          "Please provide a password to decrypt this backup & restore it."
        );

      const key = await this.db
        .storage()
        .generateCryptoKey(password, backup.data.salt);
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

    if ("hash" in backup && !this.verify(backup, decryptedData))
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
    await this.db.transaction(async () => {
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

        if (
          (await migrateItem(
            item,
            version,
            CURRENT_DATABASE_VERSION,
            item.type,
            this.db,
            "backup"
          )) === "skip"
        )
          continue;
        // since items in trash can have their own set of migrations,
        // we have to run the migration again to account for that.
        if (item.type === "trash" && item.itemType)
          if (
            (await migrateItem(
              item as unknown as Note | Notebook,
              version,
              CURRENT_DATABASE_VERSION,
              item.itemType,
              this.db,
              "backup"
            )) === "skip"
          )
            continue;

        const itemType =
          // colors are naively of type "tag" instead of "color" so we have to fix that.
          item.type === "tag" && COLORS.includes(item.title.toLowerCase())
            ? "color"
            : item.type === "trash" && "itemType" in item && item.itemType
            ? item.itemType
            : item.type;

        if (!itemType || itemType === "topic" || itemType === "settings")
          continue;

        if (item.type === "attachment" && (item.hash || item.metadata?.hash)) {
          const attachment = await this.db.attachments.attachment(
            item.metadata?.hash || item.hash
          );
          if (attachment) {
            const isNewGeneric =
              item.metadata?.type === "application/octet-stream" ||
              item.mimeType === "application/octet-stream";
            const isOldGeneric =
              attachment.mimeType === "application/octet-stream";
            item = {
              ...attachment,
              mimeType:
                // we keep whichever mime type is more specific
                isNewGeneric && !isOldGeneric
                  ? attachment.mimeType
                  : item.metadata?.type || item.mimeType,
              filename:
                // we keep the filename based on which item's mime type we kept
                isNewGeneric && !isOldGeneric
                  ? attachment.filename
                  : item.metadata?.filename || item.filename
            };
            for (const noteId of item.noteIds || []) {
              await this.db.relations.add(
                {
                  id: noteId,
                  type: "note"
                },
                attachment
              );
            }
          } else {
            delete item.dateUploaded;
            delete item.failed;
          }
        }

        const collectionKey = itemTypeToCollectionKey[itemType];
        const collection =
          collectionKey === "sessioncontent"
            ? this.db.noteHistory.sessionContent.collection
            : this.db[collectionKey].collection;

        // items should sync immediately after getting restored
        item.dateModified = Date.now();
        item.synced = false;

        await collection.upsert(item as any);
      }
    });
  }

  private validate(backup: LegacyBackupFile | BackupFile) {
    return (
      !!backup.date &&
      !!backup.data &&
      !!backup.type &&
      validTypes.some((t) => t === backup.type)
    );
  }

  private verify(
    backup: BackupFile | LegacyUnencryptedBackupFile,
    data: string | Record<string, BackupDataItem>
  ) {
    const { hash, hash_type } = backup;
    switch (hash_type) {
      case "md5": {
        return (
          hash ===
          SparkMD5.hash(typeof data === "string" ? data : JSON.stringify(data))
        );
      }
      default: {
        return false;
      }
    }
  }
}

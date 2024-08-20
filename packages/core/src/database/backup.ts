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
  Attachment,
  Item,
  MaybeDeletedItem,
  Note,
  Notebook,
  Relation,
  ValueOf,
  isDeleted
} from "../types.js";
import { Cipher, SerializedKey } from "@notesnook/crypto";
import { isCipher } from "./crypto.js";
import { migrateItem } from "../migrations";
import { DatabaseCollection } from "./index.js";
import { DefaultColors } from "../collections/colors.js";
import { toChunks } from "../utils/array.js";
import { logger } from "../logger.js";

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

export type BackupFile = UnencryptedBackupFile | EncryptedBackupFile;
export type LegacyBackupFile =
  | LegacyUnencryptedBackupFile
  | LegacyEncryptedBackupFile;

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

/**
 * Due to a bug in v3.0, legacy backups were created with version set to 6.1
 * while their actual data was at version 5.9. This caused various issues when
 * restoring such a backup.
 * This function tries to work around that bug by detecting the version based on
 * the actual data.
 */
function isLegacyBackup(data: BackupDataItem[]) {
  const note = data.find(
    (c): c is Note => !isDeleted(c) && !Array.isArray(c) && c.type === "note"
  );
  if (note)
    return (
      "color" in note ||
      "notebooks" in note ||
      "tags" in note ||
      "locked" in note
    );

  const notebook = data.find(
    (c): c is Notebook =>
      !isDeleted(c) && !Array.isArray(c) && c.type === "notebook"
  );
  if (notebook) return "topics" in notebook;

  const attachment = data.find(
    (c): c is Attachment =>
      !isDeleted(c) && !Array.isArray(c) && c.type === "attachment"
  );
  if (attachment) return "noteIds" in attachment;

  const relation = data.find(
    (c): c is Relation =>
      !isDeleted(c) && !Array.isArray(c) && c.type === "relation"
  );
  if (relation) return "from" in relation || "to" in relation;

  return false;
}

const MAX_CHUNK_SIZE = 10 * 1024 * 1024;

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
  notehistory: "noteHistory",
  content: "content",
  shortcut: "shortcuts",
  settingitem: "settings",
  settings: "settings",
  vault: "vaults"
} as const;

type CollectionName = ValueOf<typeof itemTypeToCollectionKey>;

const validTypes = ["mobile", "web", "node"];
export default class Backup {
  migrator = new Migrator();
  constructor(private readonly db: Database) {}

  lastBackupTime() {
    return this.db.kv().read("lastBackupTime");
  }

  async updateBackupTime() {
    await this.db.kv().write("lastBackupTime", Date.now());
  }

  /**
   * @deprecated
   */
  async *exportLegacy(type: BackupPlatform, encrypt = false) {
    if (!validTypes.some((t) => t === type))
      throw new Error("Invalid type. It must be one of 'mobile' or 'web'.");
    if (encrypt && !(await this.db.user.getLegacyUser())) encrypt = false;

    const key = await this.db.user.getLegacyEncryptionKey();
    if (encrypt && !key) encrypt = false;

    const keys = await this.db.storage().getAllKeys();
    const chunks = toChunks(keys, 20);
    let buffer: string[] = [];
    let bufferLength = 0;
    const MAX_CHUNK_SIZE = 10 * 1024 * 1024;
    let chunkIndex = 0;

    while (chunks.length > 0) {
      const chunk = chunks.pop();
      if (!chunk) break;

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
          type: "file" as const,
          path: `${chunkIndex++}-${encrypt ? "encrypted" : "plain"}-${hash}`,
          data: `{
"version": 5.9,
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

  async *export(options: {
    type: BackupPlatform;
    encrypt?: boolean;
    mode?: "full" | "partial";
  }): AsyncGenerator<
    | {
        type: "file";
        path: string;
        data: string;
      }
    | {
        type: "attachment";
        path: string;
        hash: string;
        total: number;
        current: number;
      },
    void,
    unknown
  > {
    const { encrypt = false, type, mode = "partial" } = options;
    if (this.db.migrations.version === 5.9) {
      yield* this.exportLegacy(type, encrypt);
      return;
    }

    if (!validTypes.some((t) => t === type))
      throw new Error("Invalid type. It must be one of 'mobile' or 'web'.");
    const user = await this.db.user.getUser();
    if (encrypt && !user)
      throw new Error("Please login to create encrypted backups.");

    const key = await this.db.user.getEncryptionKey();
    if (encrypt && !key) throw new Error("No encryption key found.");

    yield {
      type: "file",
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
    yield* this.backupCollection(this.db.vaults.collection, backupState);

    if (backupState.buffer.length > 0) yield* this.bufferToFile(backupState);
    if (mode === "partial") {
      await this.updateBackupTime();
      return;
    }

    const total = await this.db.attachments.all.count();
    if (total > 0 && user && user.attachmentsKey) {
      yield {
        type: "file",
        path: `attachments/.attachments_key`,
        data: backupState.encrypt
          ? JSON.stringify(user.attachmentsKey)
          : JSON.stringify((await this.db.user.getAttachmentsKey()) || {})
      };

      let current = 0;
      for await (const attachment of this.db.attachments.all) {
        current++;
        if (
          !(await this.db
            .fs()
            .downloadFile("backup", attachment.hash, attachment.chunkSize))
        )
          continue;
        yield {
          type: "attachment",
          hash: attachment.hash,
          path: `attachments/${attachment.hash}`,
          total,
          current
        };
      }
    }

    await this.updateBackupTime();
  }

  private async *backupCollection<T, B extends boolean>(
    collection: DatabaseCollection<T, B>,
    state: BackupState
  ) {
    for await (const item of collection.stream(
      this.db.options.batchSize
    ) as any) {
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
      type: "file" as const,
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

  async import(
    backup: LegacyBackupFile | BackupFile,
    options: {
      password?: string;
      encryptionKey?: string;
      attachmentsKey?: SerializedKey | Cipher<"base64">;
    } = {}
  ) {
    if (!this.validate(backup)) throw new Error("Invalid backup.");

    const { encryptionKey, password, attachmentsKey } = options;

    backup = this.migrateBackup(backup);

    let decryptedData: string | Record<string, BackupDataItem> | undefined =
      undefined;
    let decryptedAttachmentsKey: SerializedKey | undefined = undefined;
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

      decryptedAttachmentsKey = isCipher(attachmentsKey)
        ? (JSON.parse(
            await this.db.storage().decrypt(key, attachmentsKey)
          ) as Cipher<"base64">)
        : attachmentsKey;
      try {
        decryptedData = await this.db.storage().decrypt(key, backup.data);
      } catch (e) {
        logger.error(e, "Failed to import backup");
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
      if (!isCipher(attachmentsKey)) decryptedAttachmentsKey = attachmentsKey;
      decryptedData = backup.data;
    }

    if (!decryptedData) return;

    if ("hash" in backup && !this.verify(backup, decryptedData))
      throw new Error("Backup file has been tempered, aborting...");

    if ("compressed" in backup && typeof decryptedData === "string")
      decryptedData = await this.db.compressor().decompress(decryptedData);

    const data =
      typeof decryptedData === "string"
        ? (JSON.parse(decryptedData) as unknown)
        : Object.values(decryptedData);

    if (!data) throw new Error("No data found.");

    const normalizedData: BackupDataItem[] = Array.isArray(data)
      ? (data as BackupDataItem[])
      : typeof data === "object"
      ? Object.values(data)
      : [];
    await this.migrateData(
      normalizedData,
      backup.version === 6.1 && isLegacyBackup(normalizedData)
        ? 5.9
        : backup.version,
      decryptedAttachmentsKey
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
      case 6.0:
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

  private async migrateData(
    data: BackupDataItem[],
    version: number,
    attachmentsKey?: SerializedKey
  ) {
    const queue: Partial<Record<CollectionName, MaybeDeletedItem<Item>[]>> = {};
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
        item.type === "tag" && DefaultColors[item.title.toLowerCase()]
          ? "color"
          : item.type === "trash" && "itemType" in item && item.itemType
          ? item.itemType
          : item.type;

      if (!itemType || itemType === "topic" || itemType === "settings")
        continue;

      if (item.type === "attachment" && (item.metadata?.hash || item.hash)) {
        const attachment = await this.db.attachments.attachment(
          item.metadata?.hash || item.hash
        );
        const isSameKey =
          !!attachment &&
          attachment.key.iv === item.key.iv &&
          attachment.key.cipher === item.key.cipher &&
          attachment.key.salt === item.key.salt;

        if (attachmentsKey && !isSameKey) {
          const newKey = await this.db.attachments.encryptKey(
            JSON.parse(
              await this.db.storage().decrypt(attachmentsKey, item.key)
            )
          );
          if (attachment) {
            attachment.key = newKey;
            attachment.iv = item.iv;
            attachment.salt = item.salt;
            attachment.size = item.size;
          } else item.key = newKey;
          delete item.dateUploaded;
          delete item.failed;
        }

        if (attachment) {
          if (
            attachmentsKey &&
            isSameKey &&
            !(await this.db.fs().exists(attachment.hash)) &&
            (await this.db.fs().getUploadedFileSize(attachment.hash)) <= 0
          ) {
            delete item.dateUploaded;
            delete item.failed;
          }

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

      const collectionKey: CollectionName = itemTypeToCollectionKey[itemType];
      if (!collectionKey) continue;

      if (itemType === "color") {
        item.dateModified = Date.now();
        item.synced = false;
        await this.db.colors.collection.upsert(item as any);
      } else if (itemType === "tag") {
        item.dateModified = Date.now();
        item.synced = false;
        await this.db.tags.collection.upsert(item as any);
      } else {
        queue[collectionKey] = queue[collectionKey] || [];
        queue[collectionKey]?.push(item);
      }
    }

    for (const key in queue) {
      const collectionKey = key as CollectionName;
      const collection =
        collectionKey === "sessioncontent"
          ? this.db.noteHistory.sessionContent.collection
          : this.db[collectionKey].collection;
      if (!collection) continue;
      const items = queue[collectionKey];
      if (!items) continue;

      await collection.put(items as any[]);
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

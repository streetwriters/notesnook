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

import { Cipher, SerializedKey } from "@notesnook/crypto";
import Database from "..";
import { CURRENT_DATABASE_VERSION } from "../../common";
import { Item, MaybeDeletedItem } from "../../types";

export type SyncableItemType =
  | "note"
  | "shortcut"
  | "notebook"
  | "content"
  | "attachment"
  | "reminder"
  | "relation"
  | "color"
  | "tag"
  | "settings";
export type CollectedResult = {
  items: (MaybeDeletedItem<Item> | Cipher)[];
  types: (SyncableItemType | "vaultKey")[];
};

export type SyncItem = {
  id: string;
  v: number;
} & Cipher;

class Collector {
  private lastSyncedTimestamp = 0;
  private key?: SerializedKey;
  constructor(private readonly db: Database) {}

  async collect(lastSyncedTimestamp: number, isForceSync?: boolean) {
    await this.db.notes.init();

    this.lastSyncedTimestamp = lastSyncedTimestamp;
    this.key = await this.db.user.getEncryptionKey();
    const vaultKey = await this.db.vault.getKey();

    const collections = {
      note: this.db.notes.raw,
      shortcut: this.db.shortcuts.raw,
      notebook: this.db.notebooks.raw,
      content: await this.db.content.all(),
      attachment: this.db.attachments.syncable,
      reminder: this.db.reminders.raw,
      relation: this.db.relations.raw,
      color: this.db.colors.raw,
      tag: this.db.tags.raw,
      settings: [this.db.settings.raw]
    };

    const result: CollectedResult = {
      items: [],
      types: []
    };
    for (const type in collections) {
      this.collectInternal(
        type as SyncableItemType,
        collections[type as SyncableItemType],
        result,
        isForceSync
      );
    }

    if (vaultKey) {
      result.items.push(vaultKey);
      result.types.push("vaultKey");
    }

    return result;
  }

  private serialize(item: MaybeDeletedItem<Item>) {
    if (!this.key) throw new Error("No encryption key found.");
    return this.db.storage().encrypt(this.key, JSON.stringify(item));
  }

  encrypt(array: MaybeDeletedItem<Item>[]) {
    if (!array.length) return [];
    return Promise.all(array.map(this.map, this));
  }

  private collectInternal(
    itemType: SyncableItemType,
    items: MaybeDeletedItem<Item>[],
    result: CollectedResult,
    isForceSync?: boolean
  ) {
    if (!items || !items.length) return;

    for (const item of items) {
      if (!item) continue;

      const isSyncable = !item.synced || isForceSync;
      const isUnsynced =
        item.dateModified > this.lastSyncedTimestamp || isForceSync;

      if (isUnsynced && isSyncable) {
        result.items.push(
          "localOnly" in item && item.localOnly
            ? {
                id: item.id,
                deleted: true,
                dateModified: item.dateModified,
                deleteReason: "localOnly"
              }
            : item
        );
        result.types.push(itemType);
      }
    }
  }

  private async map(item: MaybeDeletedItem<Item>) {
    // synced is a local only property
    delete item.synced;

    return {
      id: item.id,
      v: CURRENT_DATABASE_VERSION,
      ...(await this.serialize(item))
    };
  }
}
export default Collector;

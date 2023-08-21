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

import { migrateItem } from "../../migrations";
import { set } from "../../utils/set";
import { logger } from "../../logger";
import { isHTMLEqual } from "../../utils/html-diff";
import { EV, EVENTS } from "../../common";
import Database from "..";
import { SyncItem, SyncableItemType } from "./collector";
import { Item, ItemMap, MaybeDeletedItem, isDeleted } from "../../types";
import { SerializedKey } from "@notesnook/crypto";
import { isCipher } from "../../database/crypto";

type Conflict<P extends SyncableItemType> = (
  local: MaybeDeletedItem<ItemMap[P]>,
  remote: MaybeDeletedItem<ItemMap[P]>
) => Promise<void>;

type Set<P extends SyncableItemType> = (
  item: MaybeDeletedItem<ItemMap[P]>
) => Promise<void>;

type Get<P extends SyncableItemType> = (
  id: string
) =>
  | MaybeDeletedItem<ItemMap[P]>
  | undefined
  | Promise<MaybeDeletedItem<ItemMap[P]> | undefined>;

type MergeDefinition = {
  [P in SyncableItemType]: {
    threshold?: number;
    get?: Get<P>;
    set: Set<P>;
    conflict?: Conflict<P>;
  };
};

class Merger {
  private mergeDefinition: MergeDefinition;
  private logger = logger.scope("Merger");
  private lastSynced = 0;
  private key?: SerializedKey;
  constructor(private readonly db: Database) {
    this.mergeDefinition = {
      settings: {
        threshold: 1000,
        get: () => this.db.settings.raw,
        set: (item) => this.db.settings.merge(item),
        conflict: (_local, remote) => this.db.settings.merge(remote)
      },
      note: {
        get: (id) => this.db.notes.note(id)?.data,
        set: (item) => this.db.notes.merge(item)
      },
      shortcut: {
        get: (id) => this.db.shortcuts.shortcut(id),
        set: (item) => this.db.shortcuts.merge(item)
      },
      reminder: {
        get: (id) => this.db.reminders.reminder(id),
        set: (item) => this.db.reminders.merge(item)
      },
      relation: {
        get: (id) => this.db.relations.relation(id),
        set: (item) => this.db.relations.merge(item)
      },
      tag: {
        get: (id) => this.db.tags.tag(id),
        set: (item) => this.db.tags.merge(item)
      },
      color: {
        get: (id) => this.db.colors.color(id),
        set: (item) => this.db.colors.merge(item)
      },
      notebook: {
        threshold: 1000,
        get: (id) => this.db.notebooks.notebook(id)?.data,
        set: (item) => this.db.notebooks.merge(item),
        conflict: (_local, remote) => this.db.notebooks.merge(remote)
      },
      content: {
        threshold: process.env.NODE_ENV === "test" ? 6 * 1000 : 60 * 1000,
        get: (id) => this.db.content.raw(id),
        set: async (item) => {
          await this.db.content.merge(item);
        },
        conflict: async (local, remote) => {
          if (isDeleted(local) || isDeleted(remote)) {
            if (remote.dateModified > local.dateModified)
              await db.content.merge(remote);
            return;
          }

          const note = this.db.notes.note(local.noteId);
          if (!note || !note.data) return;

          // if hashes are equal do nothing
          if (
            !note.locked &&
            (!remote ||
              !local ||
              !local.data ||
              !remote.data ||
              isHTMLEqual(local.data, remote.data))
          )
            return;

          if (note.locked) {
            // if note is locked or content is deleted we keep the most recent version.
            if (remote.dateModified > local.dateModified)
              await this.db.content.merge({ ...remote, id: local.id });
          } else {
            // otherwise we trigger the conflicts
            await this.db.content.merge({ ...local, conflicted: remote });
            await this.db.notes.add({ id: local.noteId, conflicted: true });
            await this.db.storage().write("hasConflicts", true);
          }
        }
      },
      attachment: {
        set: async (remoteAttachment) => {
          if (isDeleted(remoteAttachment)) {
            await this.db.attachments.merge(remoteAttachment);
            return;
          }

          const localAttachment = this.db.attachments.attachment(
            remoteAttachment.metadata.hash
          );
          if (
            localAttachment &&
            localAttachment.dateUploaded !== remoteAttachment.dateUploaded
          ) {
            const noteIds = localAttachment.noteIds.slice();
            const isRemoved = await this.db.attachments.remove(
              localAttachment.metadata.hash,
              true
            );
            if (!isRemoved)
              throw new Error(
                "Conflict could not be resolved in one of the attachments."
              );
            remoteAttachment.noteIds = set.union(
              remoteAttachment.noteIds,
              noteIds
            );
          }
          await this.db.attachments.merge(remoteAttachment);
        }
      }
    };
  }

  async _migrate(deserialized: Item, version: number) {
    // it is a locked note, bail out.
    if (isCipher(deserialized) && deserialized.alg && deserialized.cipher)
      return deserialized;

    return migrateItem(deserialized, version, deserialized.type, this.db);
  }

  async _deserialize(item: SyncItem, migrate = true) {
    if (!this.key) throw new Error("User encryption key not found.");

    const decrypted = await this.db.storage().decrypt(this.key, item);
    if (!decrypted) {
      throw new Error("Decrypted item cannot be undefined or empty.");
    }

    const deserialized = JSON.parse(decrypted);
    deserialized.remote = true;
    deserialized.synced = true;
    if (!migrate) return deserialized;
    await this._migrate(deserialized, item.v);
    return deserialized;
  }

  async _mergeItem<TItemType extends SyncableItemType>(
    syncItem: SyncItem,
    get: Get<TItemType>,
    add: Set<TItemType>
  ) {
    const remoteItem = (await this._deserialize(syncItem)) as MaybeDeletedItem<
      ItemMap[TItemType]
    >;
    const localItem = await get(remoteItem.id);
    if (!localItem || remoteItem.dateModified > localItem.dateModified) {
      await add(remoteItem);
      return remoteItem;
    }
  }

  async _mergeItemWithConflicts<TItemType extends SyncableItemType>(
    syncItem: SyncItem,
    get: Get<TItemType>,
    add: Set<TItemType>,
    markAsConflicted: Conflict<TItemType>,
    threshold: number
  ) {
    const remoteItem = (await this._deserialize(syncItem)) as MaybeDeletedItem<
      ItemMap[TItemType]
    >;
    const localItem = await get(remoteItem.id);

    if (!localItem || isDeleted(localItem)) {
      await add(remoteItem);
      return remoteItem;
    } else {
      const isResolved =
        "dateResolved" in localItem &&
        localItem.dateResolved === remoteItem.dateModified;
      const isModified =
        // the local item is modified if it was changed/modified after the last sync
        // i.e. it wasn't synced yet.
        // However, in case a sync is interrupted the local item's date modified will
        // be ahead of last sync. In that case, we also have to check if the synced flag
        // is false (it is only false if a user makes edits on the local device).
        localItem.dateModified > this.lastSynced && !localItem.synced;
      if (isModified && !isResolved) {
        // If time difference between local item's edits & remote item's edits
        // is less than threshold, we shouldn't trigger a merge conflict; instead
        // we will keep the most recently changed item.
        const timeDiff =
          Math.max(remoteItem.dateModified, localItem.dateModified) -
          Math.min(remoteItem.dateModified, localItem.dateModified);

        if (timeDiff < threshold) {
          if (remoteItem.dateModified > localItem.dateModified) {
            await add(remoteItem);
            return remoteItem;
          }
          return;
        }

        this.logger.info("Conflict detected", {
          itemId: remoteItem.id,
          isResolved,
          isModified,
          timeDiff,
          remote: remoteItem.dateModified,
          local: localItem.dateModified,
          lastSynced: this.lastSynced
        });

        await markAsConflicted(localItem, remoteItem);
      } else if (!isResolved) {
        await add(remoteItem);
        return remoteItem;
      }
    }
  }

  async mergeItem<TItemType extends SyncableItemType>(
    type: TItemType | "vaultKey",
    item: SyncItem
  ) {
    this.lastSynced = await this.db.lastSynced();

    if (!this.key) this.key = await this.db.user.getEncryptionKey();
    if (!this.key || !this.key.key || !this.key.salt) {
      EV.publish(EVENTS.userSessionExpired);
      throw new Error("User encryption key not generated. Please relogin.");
    }

    if (type === "vaultKey") {
      await this.db.vault.setKey(await this._deserialize(item, false));
      return;
    }

    const definition = this.mergeDefinition[type];
    if (definition.conflict && definition.get && definition.threshold) {
      return await this._mergeItemWithConflicts<TItemType>(
        item,
        definition.get,
        definition.set,
        definition.conflict,
        definition.threshold
      );
    } else if (definition.get && definition.set) {
      return await this._mergeItem<TItemType>(
        item,
        definition.get,
        definition.set
      );
    } else if (!definition.get && !!definition.set) {
      const remote = await this._deserialize(item);
      await definition.set(remote);
    }
  }
}
export default Merger;

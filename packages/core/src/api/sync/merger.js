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

import setManipulator from "../../utils/set";
import { logger } from "../../logger";
import { isHTMLEqual } from "../../utils/html-diff";

class Merger {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this._db = db;
    this.logger = logger.scope("Merger");

    this._mergeDefinition = {
      settings: {
        threshold: 1000,
        get: () => this._db.settings.raw,
        set: (item) => this._db.settings.merge(item),
        conflict: (_local, remote) => this._db.settings.merge(remote)
      },
      note: {
        get: (id) => this._db.notes._collection.getItem(id),
        set: (item) => this._db.notes.merge(item)
      },
      shortcut: {
        get: (id) => this._db.shortcuts.shortcut(id),
        set: (item) => this._db.shortcuts.merge(item)
      },
      reminder: {
        get: (id) => this._db.reminders.reminder(id),
        set: (item) => this._db.reminders.merge(item)
      },
      relation: {
        get: (id) => this._db.relations.relation(id),
        set: (item) => this._db.relations.merge(item)
      },
      notebook: {
        threshold: 1000,
        get: (id) => this._db.notebooks._collection.getItem(id),
        set: (item) => this._db.notebooks.merge(item),
        conflict: (_local, remote) => this._db.notebooks.merge(remote)
      },
      content: {
        threshold: process.env.NODE_ENV === "test" ? 6 * 1000 : 60 * 1000,
        get: (id) => this._db.content.raw(id),
        set: (item) => this._db.content.add(item),
        conflict: async (local, remote) => {
          let note = this._db.notes.note(local.noteId);
          if (!note || !note.data) return;
          note = note.data;

          // if hashes are equal do nothing
          if (
            !note.locked &&
            (!remote ||
              !local ||
              !local.data ||
              !remote.data ||
              remote.data === "undefined" || //TODO not sure about this
              isHTMLEqual(local.data, remote.data))
          )
            return;

          if (remote.deleted || local.deleted || note.locked) {
            // if note is locked or content is deleted we keep the most recent version.
            if (remote.dateModified > local.dateModified)
              await this._db.content.add({ id: local.id, ...remote });
          } else {
            // otherwise we trigger the conflicts
            await this._db.content.add({ ...local, conflicted: remote });
            await this._db.notes.add({ id: local.noteId, conflicted: true });
            await this._db.storage.write("hasConflicts", true);
          }
        }
      },
      attachment: {
        set: async (remoteAttachment) => {
          if (remoteAttachment.deleted) {
            return await this._db.attachments.merge(remoteAttachment);
          }

          const localAttachment = this._db.attachments.attachment(
            remoteAttachment.metadata.hash
          );
          if (
            localAttachment &&
            localAttachment.dateUploaded !== remoteAttachment.dateUploaded
          ) {
            const noteIds = localAttachment.noteIds.slice();
            const isRemoved = await this._db.attachments.remove(
              localAttachment.metadata.hash,
              true
            );
            if (!isRemoved)
              throw new Error(
                "Conflict could not be resolved in one of the attachments."
              );
            remoteAttachment.noteIds = setManipulator.union(
              remoteAttachment.noteIds,
              noteIds
            );
          }
          return await this._db.attachments.merge(remoteAttachment);
        }
      },
      vaultKey: {
        set: async (vaultKey) => this._db.vault._setKey(vaultKey)
      }
    };
  }

  async _mergeItem(remoteItem, get, add) {
    let localItem = await get(remoteItem.id);
    if (!localItem || remoteItem.dateModified > localItem.dateModified) {
      return await add(remoteItem);
    }
  }

  async _mergeItemWithConflicts(
    remoteItem,
    get,
    add,
    markAsConflicted,
    threshold
  ) {
    let localItem = await get(remoteItem.id);

    if (!localItem) {
      return await add(remoteItem);
    } else {
      const isResolved = localItem.dateResolved === remoteItem.dateModified;
      const isModified =
        // the local item is modified if it was changed/modified after the last sync
        // i.e. it wasn't synced yet.
        // However, in case a sync is interrupted the local item's date modified will
        // be ahead of last sync. In that case, we also have to check if the synced flag
        // is false (it is only false if a user makes edits on the local device).
        localItem.dateModified > this._lastSynced && !localItem.synced;
      if (isModified && !isResolved) {
        // If time difference between local item's edits & remote item's edits
        // is less than threshold, we shouldn't trigger a merge conflict; instead
        // we will keep the most recently changed item.
        const timeDiff =
          Math.max(remoteItem.dateModified, localItem.dateModified) -
          Math.min(remoteItem.dateModified, localItem.dateModified);

        if (timeDiff < threshold) {
          if (remoteItem.dateModified > localItem.dateModified) {
            return await add(remoteItem);
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
          lastSynced: this._lastSynced
        });

        await markAsConflicted(localItem, remoteItem);
      } else if (!isResolved) {
        return await add(remoteItem);
      }
    }
  }

  async mergeItem(type, item, lastSynced) {
    this._lastSynced = lastSynced;

    const definition = this._mergeDefinition[type];
    if (!type || !item || !definition) return;

    if (definition.conflict) {
      return await this._mergeItemWithConflicts(
        item,
        definition.get,
        definition.set,
        definition.conflict,
        definition.threshold
      );
    } else if (definition.get && definition.set) {
      return await this._mergeItem(item, definition.get, definition.set);
    } else if (!definition.get && definition.set) {
      return await definition.set(item);
    }
  }
}
export default Merger;

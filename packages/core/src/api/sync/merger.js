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

    this.syncCollectionMap = {
      note: "notes",
      shortcut: "shortcuts",
      reminder: "reminders",
      relation: "relations",
      notebook: "notebooks"
    };
  }

  isSyncCollection(type) {
    return !!this.syncCollectionMap[type];
  }

  isConflicted(localItem, remoteItem, lastSynced, conflictThreshold) {
    const isResolved = localItem.dateResolved === remoteItem.dateModified;
    const isModified =
      // the local item is modified if it was changed/modified after the last
      // sync i.e. it wasn't synced yet.
      // However, in case a sync is interrupted the local item's date modified
      // will be ahead of last sync. In that case, we also have to check if the
      // synced flag is false (it is only false if a user makes edits on the
      // local device).
      localItem.dateModified > lastSynced && !localItem.synced;
    if (isModified && !isResolved) {
      // If time difference between local item's edits & remote item's edits
      // is less than threshold, we shouldn't trigger a merge conflict; instead
      // we will keep the most recently changed item.
      const timeDiff =
        Math.max(remoteItem.dateModified, localItem.dateModified) -
        Math.min(remoteItem.dateModified, localItem.dateModified);

      if (timeDiff < conflictThreshold) {
        if (remoteItem.dateModified > localItem.dateModified) {
          return "merge";
        }
        return;
      }

      return "conflict";
    } else if (!isResolved) {
      return "merge";
    }
  }

  mergeItemSync(remoteItem, type, lastSynced) {
    switch (type) {
      case "note":
      case "shortcut":
      case "reminder":
      case "relation": {
        const localItem = this._db[
          this.syncCollectionMap[type]
        ]._collection.getItem(remoteItem.id);
        if (!localItem || remoteItem.dateModified > localItem.dateModified) {
          return remoteItem;
        }
        break;
      }
      case "notebook": {
        const THRESHOLD = 1000;
        const localItem = this._db.notebooks._collection.getItem(remoteItem.id);
        if (
          !localItem ||
          this.isConflicted(localItem, remoteItem, lastSynced, THRESHOLD)
        ) {
          return this._db.notebooks.merge(localItem, remoteItem, lastSynced);
        }
        break;
      }
    }
  }

  async mergeContent(remoteItem, localItem, lastSynced) {
    const THRESHOLD = process.env.NODE_ENV === "test" ? 6 * 1000 : 60 * 1000;
    const conflicted =
      localItem &&
      this.isConflicted(localItem, remoteItem, lastSynced, THRESHOLD);
    if (!localItem || conflicted === "merge") {
      return remoteItem;
    } else if (conflicted === "conflict") {
      const note = this._db.notes._collection.getItem(localItem.noteId);
      if (!note || note.deleted) return;

      // if hashes are equal do nothing
      if (
        !note.locked &&
        (!remoteItem ||
          !remoteItem ||
          !localItem.data ||
          !remoteItem.data ||
          isHTMLEqual(localItem.data, remoteItem.data))
      )
        return;

      if (remoteItem.deleted || localItem.deleted || note.locked) {
        // if note is locked or content is deleted we keep the most recent version.
        if (remoteItem.dateModified > localItem.dateModified) return remoteItem;
      } else {
        // otherwise we trigger the conflicts
        await this._db.notes.add({
          id: localItem.noteId,
          conflicted: true
        });
        await this._db.storage.write("hasConflicts", true);
        return {
          ...localItem,
          conflicted: remoteItem
        };
      }
    }
  }

  async mergeItem(remoteItem, type, lastSynced) {
    switch (type) {
      case "settings": {
        const localItem = this._db.settings.raw;
        if (
          !localItem ||
          this.isConflicted(localItem, remoteItem, lastSynced, 1000)
        ) {
          await this._db.settings.merge(remoteItem, lastSynced);
        }
        break;
      }
      case "attachment": {
        if (remoteItem.deleted)
          return this._db.attachments.merge(null, remoteItem);

        const localItem = this._db.attachments.attachment(
          remoteItem.metadata.hash
        );
        if (localItem && localItem.dateUploaded !== remoteItem.dateUploaded) {
          const noteIds = localItem.noteIds.slice();
          const isRemoved = await this._db.attachments.remove(
            localItem.metadata.hash,
            true
          );
          if (!isRemoved)
            throw new Error(
              "Conflict could not be resolved in one of the attachments."
            );
          remoteItem.noteIds = setManipulator.union(
            remoteItem.noteIds,
            noteIds
          );
        }
        return this._db.attachments.merge(localItem, remoteItem);
      }
    }
  }
}
export default Merger;

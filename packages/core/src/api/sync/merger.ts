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

import { logger } from "../../logger";
import { isHTMLEqual } from "../../utils/html-diff";
import Database from "..";
import { SYNC_COLLECTIONS_MAP } from "./types";
import {
  Attachment,
  ContentItem,
  Item,
  ItemMap,
  MaybeDeletedItem,
  Note,
  Notebook,
  TrashOrItem,
  isDeleted
} from "../../types";

class Merger {
  logger = logger.scope("Merger");
  constructor(private readonly db: Database) {}

  isSyncCollection(type: string): type is keyof typeof SYNC_COLLECTIONS_MAP {
    return type in SYNC_COLLECTIONS_MAP;
  }

  isConflicted(
    localItem: MaybeDeletedItem<Item>,
    remoteItem: MaybeDeletedItem<Item>,
    lastSynced: number,
    conflictThreshold: number
  ) {
    const isResolved =
      "dateResolved" in localItem &&
      localItem.dateResolved === remoteItem.dateModified;
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

  mergeItemSync<TType extends keyof typeof SYNC_COLLECTIONS_MAP>(
    remoteItem: MaybeDeletedItem<
      ItemMap[TType] | TrashOrItem<Note> | TrashOrItem<Notebook>
    >,
    type: TType,
    _lastSynced: number
  ) {
    switch (type) {
      case "shortcut":
      case "reminder":
      case "tag":
      case "color":
      case "note":
      case "relation":
      case "notebook":
      case "settingitem": {
        const localItem = this.db[SYNC_COLLECTIONS_MAP[type]].collection.getRaw(
          remoteItem.id
        );
        if (!localItem || remoteItem.dateModified > localItem.dateModified) {
          return remoteItem;
        }
        break;
      }
    }
  }

  async mergeContent(
    remoteItem: MaybeDeletedItem<ContentItem>,
    localItem: MaybeDeletedItem<ContentItem>,
    lastSynced: number
  ) {
    if (localItem && "localOnly" in localItem && localItem.localOnly) return;

    const THRESHOLD = process.env.NODE_ENV === "test" ? 6 * 1000 : 60 * 1000;
    const conflicted =
      localItem &&
      this.isConflicted(localItem, remoteItem, lastSynced, THRESHOLD);
    if (!localItem || conflicted === "merge") {
      return remoteItem;
    } else if (conflicted === "conflict") {
      if (isDeleted(localItem) || isDeleted(remoteItem)) {
        if (remoteItem.dateModified > localItem.dateModified) return remoteItem;
        return;
      }

      const note = this.db.notes.collection.get(localItem.noteId);
      if (!note) return;

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

      if (note.locked) {
        // if note is locked or content is deleted we keep the most recent version.
        if (remoteItem.dateModified > localItem.dateModified) return remoteItem;
      } else {
        // otherwise we trigger the conflicts
        await this.db.notes.add({
          id: localItem.noteId,
          conflicted: true
        });
        await this.db.storage().write("hasConflicts", true);
        return {
          ...localItem,
          conflicted: remoteItem
        };
      }
    }
  }

  async mergeItem(
    remoteItem: MaybeDeletedItem<Attachment>,
    type: "settings" | "attachment",
    _lastSynced: number
  ) {
    switch (type) {
      case "attachment": {
        if (isDeleted(remoteItem)) return remoteItem;

        if (remoteItem.type !== "attachment") return;

        const localAttachment = this.db.attachments.attachment(
          remoteItem.metadata.hash
        );
        if (
          localAttachment &&
          localAttachment.dateUploaded !== remoteItem.dateUploaded
        ) {
          const isRemoved = await this.db.attachments.remove(
            localAttachment.metadata.hash,
            true
          );
          if (!isRemoved)
            throw new Error(
              "Conflict could not be resolved in one of the attachments."
            );
        }
        return remoteItem;
      }
    }
  }
}
export default Merger;

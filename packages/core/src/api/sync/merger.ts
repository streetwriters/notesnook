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
import { ContentItem, Item, MaybeDeletedItem, isDeleted } from "../../types";

const THRESHOLD = process.env.NODE_ENV === "test" ? 6 * 1000 : 60 * 1000;
class Merger {
  logger = logger.scope("Merger");
  constructor(private readonly db: Database) {}

  // isSyncCollection(type: string): type is keyof typeof SYNC_COLLECTIONS_MAP {
  //   return type in SYNC_COLLECTIONS_MAP;
  // }

  mergeItemSync(
    remoteItem: MaybeDeletedItem<Item>,
    localItem: MaybeDeletedItem<Item> | undefined,
    type:
      | "shortcut"
      | "reminder"
      | "tag"
      | "color"
      | "note"
      | "relation"
      | "notebook"
      | "settingitem"
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
        if (!localItem || remoteItem.dateModified > localItem.dateModified) {
          return remoteItem;
        }
        break;
      }
    }
  }

  async mergeContent(
    remoteItem: MaybeDeletedItem<Item>,
    localItem: MaybeDeletedItem<Item> | undefined
  ) {
    if (localItem && "localOnly" in localItem && localItem.localOnly) return;

    if (
      !localItem ||
      isDeleted(localItem) ||
      isDeleted(remoteItem) ||
      remoteItem.type !== "tiptap" ||
      localItem.type !== "tiptap" ||
      localItem.locked ||
      remoteItem.locked ||
      !localItem.data ||
      !remoteItem.data
    ) {
      if (!localItem || remoteItem.dateModified > localItem.dateModified)
        return remoteItem;
      return;
    } else {
      // it's possible that the local item already has a conflict so
      // we can just replace the conflicted content
      const conflicted = localItem.conflicted
        ? "conflict"
        : isContentConflicted(localItem, remoteItem, THRESHOLD);

      if (conflicted === "merge") return remoteItem;
      else if (!conflicted) return;

      // otherwise we trigger the conflicts
      await this.db.notes.add({
        id: localItem.noteId,
        conflicted: true
      });
      localItem.conflicted = remoteItem;
      return localItem;
    }
  }

  async mergeItemAsync(
    remoteItem: MaybeDeletedItem<Item>,
    localItem: MaybeDeletedItem<Item> | undefined,
    type: "attachment"
  ) {
    switch (type) {
      case "attachment": {
        if (!localItem) return remoteItem;
        if (
          isDeleted(localItem) ||
          isDeleted(remoteItem) ||
          remoteItem.type !== "attachment" ||
          localItem.type !== "attachment"
        ) {
          if (remoteItem.dateModified > localItem.dateModified)
            return remoteItem;
          return;
        }

        if (localItem.dateUploaded !== remoteItem.dateUploaded) {
          const isRemoved = await this.db.attachments.remove(
            localItem.hash,
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

function isContentConflicted(
  localItem: ContentItem,
  remoteItem: ContentItem,
  conflictThreshold: number
) {
  const isResolved = localItem.dateResolved === remoteItem.dateModified;
  const isEdited =
    // the local item is edited if it was changed/edited after the remote
    // note and it also wasn't synced yet.
    localItem.dateEdited > remoteItem.dateEdited && !localItem.synced;
  if (isEdited && !isResolved) {
    // If time difference between local item's edits & remote item's edits
    // is less than threshold, we shouldn't trigger a merge conflict; instead
    // we will keep the most recently changed item.
    const timeDiff =
      Math.max(remoteItem.dateEdited, localItem.dateEdited) -
      Math.min(remoteItem.dateEdited, localItem.dateEdited);

    if (
      timeDiff < conflictThreshold ||
      isHTMLEqual(localItem.data, remoteItem.data)
    ) {
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

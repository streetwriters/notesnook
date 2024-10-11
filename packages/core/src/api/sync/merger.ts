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

import { logger } from "../../logger.js";
import { isHTMLEqual } from "../../utils/html-diff.js";
import Database from "../index.js";
import {
  Attachment,
  ContentItem,
  Item,
  MaybeDeletedItem,
  isDeleted
} from "../../types.js";

const THRESHOLD = process.env.NODE_ENV === "test" ? 6 * 1000 : 60 * 1000;
class Merger {
  logger = logger.scope("Merger");
  constructor(private readonly db: Database) {}

  // isSyncCollection(type: string): type is keyof typeof SYNC_COLLECTIONS_MAP {
  //   return type in SYNC_COLLECTIONS_MAP;
  // }

  mergeItem(
    remoteItem: MaybeDeletedItem<Item>,
    localItem: MaybeDeletedItem<Item> | undefined
  ) {
    if (!localItem || remoteItem.dateModified > localItem.dateModified) {
      return remoteItem;
    }
  }

  mergeContent(
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
      return this.mergeItem(remoteItem, localItem);
    } else {
      // it's possible that the local item already has a conflict so
      // we can just replace the conflicted content
      const conflicted = localItem.conflicted
        ? "conflict"
        : isContentConflicted(localItem, remoteItem, THRESHOLD);

      if (conflicted === "merge") return remoteItem;
      else if (!conflicted) return;

      // otherwise we trigger the conflicts
      this.logger.info("conflict marked", { id: localItem.noteId });
      localItem.conflicted = remoteItem;
      return localItem;
    }
  }

  async mergeAttachment(
    remoteItem: MaybeDeletedItem<Attachment>,
    localItem: MaybeDeletedItem<Attachment> | undefined
  ) {
    if (
      !localItem ||
      isDeleted(localItem) ||
      isDeleted(remoteItem) ||
      !localItem.dateUploaded ||
      !remoteItem.dateUploaded ||
      localItem.dateUploaded === remoteItem.dateUploaded
    ) {
      return this.mergeItem(remoteItem, localItem);
    }

    if (localItem.dateUploaded > remoteItem.dateUploaded) return;

    logger.debug("Removing local attachment file due to conflict", {
      hash: localItem.hash
    });
    const isRemoved = await this.db.fs().deleteFile(localItem.hash, true);
    if (!isRemoved)
      throw new Error(
        "Conflict could not be resolved in one of the attachments."
      );
    return remoteItem;
  }
}
export default Merger;

export function isContentConflicted(
  localItem: ContentItem,
  remoteItem: ContentItem,
  conflictThreshold: number
) {
  const isResolved =
    localItem.dateResolved &&
    remoteItem.dateModified &&
    localItem.dateResolved === remoteItem.dateModified;
  const isEdited =
    // the local item is edited if it wasn't synced yet.
    !localItem.synced;
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

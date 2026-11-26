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
import { DatabaseUpdatedEvent, EVENTS } from "@notesnook/core";
import { db } from "../../common/database";
import { NotePreviewWidget } from "../note-preview-widget";
import { PinnedNotesWidget } from "../pinned-notes-widget";
import { NotesWidget } from "./notes-widget";

export function updateListWidgets() {
  PinnedNotesWidget.updateNotes();
  NotesWidget.updateNotes();
}

// "notes" and "content" are left out on purpose: editor saves fire them constantly.
const LIST_WIDGET_COLLECTIONS = [
  "relations",
  "notebooks",
  "tags",
  "colors",
  "settings"
];

let watching = false;

export const WidgetRefresh = {
  /**
   * Refreshes the list widgets when what they show changes without any of the
   * explicit updateListWidgets() call sites running (tag/color/notebook changes,
   * renames, sort order). Subscribes once and never unsubscribes, so that nothing
   * else unsubscribing can take it away.
   */
  watch() {
    if (watching) return;
    watching = true;
    db.eventManager.subscribe(
      EVENTS.databaseUpdated,
      (event: DatabaseUpdatedEvent) => {
        if (LIST_WIDGET_COLLECTIONS.includes(event.collection)) {
          updateListWidgets();
        }
      }
    );
  }
};

export function updateNoteWidgets() {
  NotePreviewWidget.updateNotes();
  updateListWidgets();
}

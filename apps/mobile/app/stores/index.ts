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

import { DatabaseLogger, db } from "../common/database";
import { eSendEvent } from "../services/event-manager";
import Navigation from "../services/navigation";
import { NotePreviewWidget } from "../services/note-preview-widget";
import Notifications from "../services/notifications";
import { eAfterSync } from "../utils/events";
import { NotesnookModule, ShortcutInfo } from "../utils/notesnook-module";
import { useFavoriteStore } from "./use-favorite-store";
import { useMenuStore } from "./use-menu-store";
import { useMonographStore } from "./use-monograph-store";
import { useNotebookStore } from "./use-notebook-store";
import { useNoteStore } from "./use-notes-store";
import { useRelationStore } from "./use-relation-store";
import { useReminderStore } from "./use-reminder-store";
import { useTagStore } from "./use-tag-store";
import { useTrashStore } from "./use-trash-store";
import { useUserStore } from "./use-user-store";

async function syncShortcuts(result: ShortcutInfo[]) {
  try {
    for (let shortcut of result) {
      switch (shortcut.type) {
        case "note":
          {
            const note = await db.notes.note(shortcut.id);
            if (!note) {
              NotesnookModule.removeShortcut(shortcut.id);
            } else if (note.title !== shortcut.title) {
              NotesnookModule.updateShortcut(
                shortcut.id,
                "note",
                note.title,
                note.headline
              );
            }
          }
          break;
        case "notebook":
          {
            const notebook = await db.notebooks.notebook(shortcut.id);
            if (!notebook) {
              NotesnookModule.removeShortcut(shortcut.id);
            } else if (notebook.title !== shortcut.title) {
              NotesnookModule.updateShortcut(
                shortcut.id,
                "notebook",
                notebook.title,
                notebook.description
              );
            }
          }
          break;
        case "tag":
          {
            const tag = await db.tags.tag(shortcut.id);
            if (!tag) {
              NotesnookModule.removeShortcut(shortcut.id);
            } else if (tag.title !== shortcut.title) {
              NotesnookModule.updateShortcut(
                shortcut.id,
                "tag",
                tag.title,
                tag.title
              );
            }
          }
          break;
        case "color":
          {
            const color = await db.colors.color(shortcut.id);
            if (!color) {
              NotesnookModule.removeShortcut(shortcut.id);
            } else if (color.title !== shortcut.title) {
              NotesnookModule.updateShortcut(
                shortcut.id,
                "color",
                color.title,
                color.title,
                color.colorCode
              );
            }
          }
          break;
      }
    }
  } catch (e) {
    DatabaseLogger.error(
      e as Error,
      "Error while syncing homescreen shortcuts"
    );
  }
}

export function initAfterSync(type: "full" | "send" = "send") {
  if (type === "full") {
    Navigation.queueRoutesForUpdate();
    // Whenever sync completes, try to reschedule
    // any new/updated reminders.
    useRelationStore.getState().update();
    useMenuStore.getState().setColorNotes();
    useMenuStore.getState().setMenuPins();
    useUserStore.setState({
      profile: db.settings.getProfile()
    });
  }

  Notifications.setupReminders(true);
  NotePreviewWidget.updateNotes();
  eSendEvent(eAfterSync);
  NotesnookModule.getAllShortcuts().then(syncShortcuts);
}

export async function initialize() {}

export function clearAllStores() {
  useNotebookStore.getState().clear();
  useTagStore.getState().clear();
  useFavoriteStore.getState().clear();
  useMenuStore.getState().clearAll();
  useNoteStore.getState().clear();
  useMenuStore.getState().clearAll();
  useTrashStore.getState().clear();
  useReminderStore.getState().clear();
  useMonographStore.getState().clear();
}

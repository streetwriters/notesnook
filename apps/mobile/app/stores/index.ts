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

import { db } from "../common/database";
import Navigation from "../services/navigation";
import { NotePreviewWidget } from "../services/note-preview-widget";
import Notifications from "../services/notifications";
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

export function initAfterSync() {
  Navigation.queueRoutesForUpdate();
  // Whenever sync completes, try to reschedule
  // any new/updated reminders.
  Notifications.setupReminders(true);
  useRelationStore.getState().update();
  useMenuStore.getState().setColorNotes();
  useMenuStore.getState().setMenuPins();
  useMonographStore.getState().refresh();
  useUserStore.setState({
    profile: db.settings.getProfile()
  });

  NotePreviewWidget.updateNotes();
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

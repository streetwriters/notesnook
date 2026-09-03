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
import { strings } from "@notesnook/intl";
import { db } from "../common/database";
import { NotesnookModule } from "../utils/notesnook-module";
import { Platform } from "react-native";

let timer: NodeJS.Timeout;

/**
 * Service to synchronize pinned notes from the Notesnook database to the native
 * Android Pinned Notes home screen widget via SharedPreferences.
 */
export const PinnedNotesWidget = {
  /**
   * Queries all currently pinned notes, sanitizes them into a lightweight payload,
   * stores them in SharedPreferences, and requests a widget redraw.
   * Debounced to prevent redundant native updates during rapid consecutive edits.
   */
  updateNotes: () => {
    if (Platform.OS !== "android") return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const pinnedNotes = await db.notes.pinned.items();
        const payload = (pinnedNotes || []).map((note) => ({
          id: note.id,
          title: note.title || strings.untitledNote(),
          headline: note.headline || "",
          dateEdited: note.dateEdited,
          pinned: true
        }));

        NotesnookModule.setString(
          "appPreview",
          "pinnedNotesList",
          JSON.stringify(payload)
        );
        NotesnookModule.updatePinnedNotesWidget();
      } catch (err) {
        console.error("Failed to update pinned notes widget:", err);
      }
    }, 500);
  }
};

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
import { Note } from "@notesnook/core";
import { db } from "../common/database";
import { NotesnookModule } from "../utils/notesnook-module";
import { Platform } from "react-native";

let timer: NodeJS.Timeout;
export const NotePreviewWidget = {
  updateNotes: () => {
    if (Platform.OS !== "android") return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const noteIds = await NotesnookModule.getWidgetNotes();
      for (const id of noteIds) {
        const newNote = await db.notes.note(id);
        if (!newNote) continue;

        NotesnookModule.updateWidgetNote(id, JSON.stringify(newNote));
      }
    }, 500);
  },
  updateNote: async (id: string, note: Note) => {
    if (Platform.OS !== "android") return;
    if (id && (await NotesnookModule.hasWidgetNote(id))) {
      NotesnookModule.updateWidgetNote(id, JSON.stringify(note));
    }
  }
};

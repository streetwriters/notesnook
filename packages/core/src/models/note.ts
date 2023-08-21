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

import Database from "../api";
import { isDeleted, type Note } from "../types";

export function createNoteModel(note: Note, db: Database) {
  return {
    ...note,
    data: note,
    async content() {
      if (!note.contentId) return null;
      const content = await db.content.raw(note.contentId);
      return content && !isDeleted(content) ? content.data : null;
    },
    synced() {
      return !note.contentId || db.content.exists(note.contentId);
    },
    localOnly() {
      return toggleProperty(db, note, "localOnly");
    },
    favorite() {
      return toggleProperty(db, note, "favorite");
    },
    pin() {
      return toggleProperty(db, note, "pinned");
    },
    readonly() {
      return toggleProperty(db, note, "readonly");
    }
  };
}

function toggleProperty(db: Database, note: Note, property: keyof Note) {
  return db.notes.add({ id: note.id, [property]: !note[property] });
}

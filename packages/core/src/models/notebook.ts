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
import { Notebook } from "../types";

export function createNotebookModel(notebook: Notebook, db: Database) {
  return {
    ...notebook,
    /**
     * @deprecated please use `notebook` directly instead
     */
    data: notebook,
    /**
     * @deprecated please use `db.notebooks.totalNotes()` instead
     */
    totalNotes: (function () {
      return db.notebooks.totalNotes(notebook.id);
    })(),
    /**
     * @deprecated please use `db.notebooks.pin()` & `db.notebooks.unpin()` instead.
     */
    pin() {
      return db.notebooks?.add({
        id: notebook.id,
        pinned: !notebook.pinned
      });
    }
  };
}

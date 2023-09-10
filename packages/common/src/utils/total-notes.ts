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
import { database } from "../database";

export function getTotalNotes(item?: any) {
  if (!item || (item.type !== "notebook" && item.type !== "topic")) return 0;
  if (item.type === "topic") {
    return (
      database.notebooks?.notebook(item.notebookId)?.topics.topic(item.id)
        ?.totalNotes || 0
    );
  }
  return database.notebooks?.notebook(item.id)?.totalNotes || 0;
}

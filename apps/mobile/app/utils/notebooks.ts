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
import { eSendEvent } from "../services/event-manager";
import { useNotebookStore } from "../stores/use-notebook-store";
import { eOnNotebookUpdated } from "./events";

export async function findRootNotebookId(id: string) {
  const relation = await db.relations
    .to(
      {
        id,
        type: "notebook"
      },
      "notebook"
    )
    .get();
  if (!relation || !relation.length) {
    return id;
  } else {
    return findRootNotebookId(relation[0].fromId);
  }
}

export async function getParentNotebookId(id: string) {
  const relation = await db.relations
    .to(
      {
        id,
        type: "notebook"
      },
      "notebook"
    )
    .get();

  return relation?.[0]?.fromId;
}

export async function updateNotebook(id?: string, updateParent?: boolean) {
  eSendEvent(eOnNotebookUpdated, id);
  if (updateParent && id) {
    const parent = await getParentNotebookId(id);
    if (parent) {
      eSendEvent(eOnNotebookUpdated, parent);
    } else {
      useNotebookStore.getState().refresh();
    }
  }
}

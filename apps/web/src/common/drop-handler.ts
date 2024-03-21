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

import { ItemReference } from "@notesnook/core";
import { Context } from "../components/list-container/types";
import { getDragData } from "../utils/data-transfer";
import { db } from "./db";
import { useStore as useNoteStore } from "../stores/note-store";
import { useStore as useNotebookStore } from "../stores/notebook-store";
import { useStore as useTagStore } from "../stores/tag-store";

export async function handleDrop(
  dataTransfer: DataTransfer,
  item:
    | ItemReference
    | Context
    | { type: "trash" | "notebooks" | "favorites" | undefined }
) {
  if (!item.type) return;

  const noteIds = getDragData(dataTransfer, "note");
  const notebookIds = getDragData(dataTransfer, "notebook");
  const { setColor, favorite, delete: trashNotes } = useNoteStore.getState();
  switch (item.type) {
    case "notebook":
      if (noteIds.length > 0) {
        await db.notes?.addToNotebook(item.id, ...noteIds);
        await useNoteStore.getState().refresh();
        await useNotebookStore.getState().refresh();
      } else if (notebookIds.length > 0) {
        const breadcrumbs = await db.notebooks.breadcrumbs(item.id);
        for (const notebookId of notebookIds) {
          if (breadcrumbs.findIndex((b) => b.id === notebookId) > -1) continue;

          await db.relations
            .to({ type: "notebook", id: notebookId }, "notebook")
            .unlink();
          await db.relations.add(item, {
            type: "notebook",
            id: notebookId
          });
        }
        await useNotebookStore.getState().refresh();
      }
      break;
    case "color":
      return setColor(item.id, false, ...noteIds);
    case "favorites":
    case "favorite":
      return favorite(true, ...noteIds);
    case "tag":
      for (const noteId of noteIds) {
        await db.relations.add(item, { type: "note", id: noteId });
      }
      await useNoteStore.getState().refresh();
      await useTagStore.getState().refresh();
      break;
    case "trash":
      trashNotes(...noteIds);
      break;
    case "notebooks":
      if (notebookIds.length > 0) {
        await db.relations
          .to({ type: "notebook", ids: notebookIds }, "notebook")
          .unlink();
        await useNotebookStore.getState().refresh();
        await useNoteStore.getState().refresh();
      }
      break;
  }
}

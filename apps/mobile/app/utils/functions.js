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

import { Linking } from "react-native";
import { db } from "../common/database";
import { presentDialog } from "../components/dialog/functions";
import { eSendEvent, ToastManager } from "../services/event-manager";
import Navigation from "../services/navigation";
import { useMenuStore } from "../stores/use-menu-store";
import { useRelationStore } from "../stores/use-relation-store";
import { useSelectionStore } from "../stores/use-selection-store";
import { eClearEditor, eOnNotebookUpdated } from "./events";
import { getParentNotebookId } from "./notebooks";

function confirmDeleteAllNotes(items, type, context) {
  return new Promise((resolve) => {
    presentDialog({
      title: `Delete ${
        items.length > 1 ? `${items.length} ${type}s` : `${type}`
      }?`,
      positiveText: "Delete",
      negativeText: "Cancel",
      positivePress: (value) => {
        setTimeout(() => {
          resolve({ delete: true, deleteNotes: value });
        });
      },
      onClose: () => {
        setTimeout(() => {
          resolve({ delete: false });
        });
      },
      context: context,
      check: {
        info: `Move all notes in ${
          items.length > 1 ? `these ${type}s` : `this ${type}`
        } to trash`,
        type: "transparent"
      }
    });
  });
}

async function deleteNotebook(id, deleteNotes) {
  const notebook = await db.notebooks.notebook(id);
  const parentId = getParentNotebookId(id);
  if (deleteNotes) {
    const noteRelations = await db.relations.from(notebook, "note").get();
    await db.notes.delete(...noteRelations.map((relation) => relation.toId));
  }
  const subnotebooks = await db.relations.from(notebook, "notebook").get();
  for (const subnotebook of subnotebooks) {
    await deleteNotebook(subnotebook.toId, deleteNotes);
  }
  await db.notebooks.remove(id);
  if (parentId) {
    eSendEvent(eOnNotebookUpdated, parentId);
  }
}

export const deleteItems = async (items, type, context) => {
  const ids = items ? items : useSelectionStore.getState().selectedItemsList;

  if (type === "reminder") {
    await db.reminders.remove(...ids);
    useRelationStore.getState().update();
  } else if (type === "note") {
    for (const id of ids) {
      if (db.monographs.isPublished(id)) {
        ToastManager.show({
          heading: "Some notes are published",
          message: "Unpublish published notes to delete them",
          type: "error",
          context: "global"
        });
        continue;
      }
      await db.notes.moveToTrash(id);
    }
    eSendEvent(eClearEditor);
  } else if (type === "notebook") {
    const result = await confirmDeleteAllNotes(ids, "notebook", context);
    if (!result.delete) return;
    for (const id of ids) {
      await deleteNotebook(id, result.deleteNotes);
      eSendEvent(eOnNotebookUpdated, await getParentNotebookId(id));
    }
  }

  let message = `${ids.length} ${
    ids.length === 1 ? "item" : "items"
  } moved to trash.`;

  let deletedIds = [...ids];
  if (type === "notebook" || type === "note") {
    ToastManager.show({
      heading: message,
      type: "success",
      func: async () => {
        await db.trash.restore(...deletedIds);
        Navigation.queueRoutesForUpdate();
        useMenuStore.getState().setMenuPins();
        useMenuStore.getState().setColorNotes();
        ToastManager.hide();
        if (type === "notebook") {
          deletedIds.forEach(async (id) => {
            eSendEvent(eOnNotebookUpdated, await getParentNotebookId(id));
          });
        }
      },
      actionText: "Undo"
    });
  }

  Navigation.queueRoutesForUpdate();
  if (!items) {
    useSelectionStore.getState().clearSelection();
  }
  useMenuStore.getState().setColorNotes();
  if (type === "notebook") {
    ids.forEach(async (id) => {
      eSendEvent(eOnNotebookUpdated, await getParentNotebookId(id));
    });
    useMenuStore.getState().setMenuPins();
  }
};

export const openLinkInBrowser = async (link) => {
  try {
    Linking.openURL(link);
  } catch (error) {
    console.log(error.message);
  }
};

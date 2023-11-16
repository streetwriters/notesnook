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
import SearchService from "../services/search";
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
      positivePress: (_inputValue, value) => {
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

export const deleteItems = async (item, context) => {
  if (item && db.monographs.isPublished(item.id)) {
    ToastManager.show({
      heading: "Can not delete note",
      message: "Unpublish note to delete it",
      type: "error",
      context: "global"
    });
    return;
  }

  const itemsToDelete = item
    ? [item]
    : useSelectionStore.getState().selectedItemsList;

  let notes = itemsToDelete.filter((i) => i.type === "note");
  let notebooks = itemsToDelete.filter((i) => i.type === "notebook");
  let reminders = itemsToDelete.filter((i) => i.type === "reminder");

  if (reminders.length > 0) {
    for (let reminder of reminders) {
      await db.reminders.remove(reminder.id);
    }
    useRelationStore.getState().update();
  }

  if (notes?.length > 0) {
    for (const note of notes) {
      if (db.monographs.isPublished(note.id)) {
        ToastManager.show({
          heading: "Some notes are published",
          message: "Unpublish published notes to delete them",
          type: "error",
          context: "global"
        });
        continue;
      }
      await db.notes.delete(note.id);
    }
    eSendEvent(eClearEditor);
  }

  if (notebooks?.length > 0) {
    const result = await confirmDeleteAllNotes(notebooks, "notebook", context);
    if (!result.delete) return;
    for (const notebook of notebooks) {
      await deleteNotebook(notebook.id, result.deleteNotes);
    }
  }

  let message = `${itemsToDelete.length} ${
    itemsToDelete.length === 1 ? "item" : "items"
  } moved to trash.`;

  let deletedItems = [...itemsToDelete];
  if (reminders.length === 0 && (notes.length > 0 || notebooks.length > 0)) {
    ToastManager.show({
      heading: message,
      type: "success",
      func: async () => {
        let trash = db.trash.all;
        let ids = [];
        for (var i = 0; i < deletedItems.length; i++) {
          let it = deletedItems[i];
          let trashItem = trash.find((item) => item.id === it.id);
          ids.push(trashItem.id);
        }
        await db.trash.restore(...ids);
        Navigation.queueRoutesForUpdate();
        useMenuStore.getState().setMenuPins();
        useMenuStore.getState().setColorNotes();
        ToastManager.hide();
      },
      actionText: "Undo"
    });
  }

  Navigation.queueRoutesForUpdate();
  if (!item) {
    useSelectionStore.getState().clearSelection();
  }
  useMenuStore.getState().setMenuPins();
  useMenuStore.getState().setColorNotes();
  SearchService.updateAndSearch();
};

export const openLinkInBrowser = async (link) => {
  try {
    Linking.openURL(link);
  } catch (error) {
    console.log(error.message);
  }
};

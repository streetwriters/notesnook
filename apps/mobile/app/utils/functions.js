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
import { eOnNotebookUpdated, eUpdateNoteInEditor } from "./events";
import { getParentNotebookId } from "./notebooks";
import { useTagStore } from "../stores/use-tag-store";
import { strings } from "@notesnook/intl";

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
    if (noteRelations?.length) {
      await db.notes.moveToTrash(
        ...noteRelations.map((relation) => relation.toId)
      );
    }
  }
  await db.notebooks.moveToTrash(id);
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
          heading: strings.someNotesPublished(),
          message: strings.unpublishToDelete(),
          type: "error",
          context: "global"
        });
        continue;
      }
      await db.notes.moveToTrash(id);

      eSendEvent(
        eUpdateNoteInEditor,
        {
          type: "trash",
          id: id,
          itemType: "note"
        },
        true
      );
    }
  } else if (type === "notebook") {
    const result = await confirmDeleteAllNotes(ids, "notebook", context);
    if (!result.delete) return;
    for (const id of ids) {
      await deleteNotebook(id, result.deleteNotes);
      eSendEvent(eOnNotebookUpdated, await getParentNotebookId(id));
    }
  } else if (type === "tag") {
    presentDialog({
      title: strings.deleteTags(ids.length),
      positiveText: strings.delete(),
      negativeText: strings.cancel(),
      paragraph: strings.deleteTagsConfirm(),
      positivePress: async () => {
        await db.tags.remove(...ids);
        useTagStore.getState().refresh();
        useRelationStore.getState().update();
      },
      context: context
    });
    return;
  }

  let deletedIds = [...ids];
  if (type === "notebook" || type === "note") {
    let message = strings.movedToTrash(type, ids.length);
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
  } else {
    ToastManager.show({
      heading: strings.deleted(type, ids.length),
      type: "success"
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

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

import { ItemType } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Linking } from "react-native";
import { db } from "../common/database";
import { presentDialog } from "../components/dialog/functions";
import {
  useSideMenuNotebookSelectionStore,
  useSideMenuTagsSelectionStore
} from "../components/side-menu/stores";
import { eSendEvent, ToastManager } from "../services/event-manager";
import Navigation from "../services/navigation";
import { useMenuStore } from "../stores/use-menu-store";
import { useNotebookStore } from "../stores/use-notebook-store";
import { useRelationStore } from "../stores/use-relation-store";
import { useTagStore } from "../stores/use-tag-store";
import { eUpdateNoteInEditor } from "./events";

export function getObfuscatedEmail(email: string) {
  if (!email) return "";
  const [username, provider] = email.split("@");
  if (username.length === 1) return `****@${provider}`;
  return email.replace(/(.{3})(.*)(?=@)/, function (gp1, gp2, gp3) {
    for (let i = 0; i < gp3.length; i++) {
      gp2 += "*";
    }
    return gp2;
  });
}

function confirmDeleteAllNotes(
  items: string[],
  type: "notebook",
  context?: string
) {
  return new Promise<{ delete: boolean; deleteNotes: boolean }>((resolve) => {
    presentDialog({
      title: strings.doActions.delete.notebook(items.length),
      positiveText: strings.delete(),
      negativeText: strings.cancel(),
      positivePress: (_inputValue, value) => {
        setTimeout(() => {
          resolve({ delete: true, deleteNotes: value });
        });
      },
      onClose: () => {
        setTimeout(() => {
          resolve({ delete: false, deleteNotes: false });
        });
      },
      context: context,
      check: {
        info: strings.deleteContainingNotes(items.length),
        type: "transparent"
      }
    });
  });
}

async function deleteNotebook(id: string, deleteNotes: boolean) {
  const notebook = await db.notebooks.notebook(id);
  if (!notebook) return;
  if (deleteNotes) {
    const noteRelations = await db.relations.from(notebook, "note").get();
    if (noteRelations?.length) {
      await db.notes.moveToTrash(
        ...noteRelations.map((relation) => relation.toId)
      );
    }
  }
  await db.notebooks.moveToTrash(id);
}

export const deleteItems = async (
  type: ItemType,
  itemIds: string[],
  context?: string
) => {
  if (type === "reminder") {
    await db.reminders.remove(...itemIds);
    useRelationStore.getState().update();
  } else if (type === "note") {
    for (const id of itemIds) {
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
    const result = await confirmDeleteAllNotes(itemIds, "notebook", context);
    if (!result.delete) return;
    for (const id of itemIds) {
      await deleteNotebook(id, result.deleteNotes);
    }
    useSideMenuNotebookSelectionStore.setState({
      enabled: false,
      selection: {}
    });
  } else if (type === "tag") {
    presentDialog({
      title: strings.doActions.delete.tag(itemIds.length),
      positiveText: strings.delete(),
      negativeText: strings.cancel(),
      paragraph: strings.actionConfirmations.delete.tag(2),
      positivePress: async () => {
        await db.tags.remove(...itemIds);
        useTagStore.getState().refresh();
        useRelationStore.getState().update();
        useSideMenuTagsSelectionStore.setState({
          enabled: false,
          selection: {}
        });
      },
      context: context
    });
    return;
  }

  const deletedIds = [...itemIds];
  if (type === "notebook" || type === "note") {
    const message = strings.actions.movedToTrash[type](itemIds.length);
    ToastManager.show({
      heading: message,
      type: "success",
      func: async () => {
        if ((await db.trash.restore(...deletedIds)) === false) return;
        Navigation.queueRoutesForUpdate();
        useMenuStore.getState().setMenuPins();
        useMenuStore.getState().setColorNotes();
        ToastManager.hide();
        if (type === "notebook") {
          useNotebookStore.getState().refresh();
        }
      },
      actionText: "Undo"
    });
  } else {
    ToastManager.show({
      heading: strings.actions.deleted.unknown(type, itemIds.length),
      type: "success"
    });
  }

  Navigation.queueRoutesForUpdate();
  useMenuStore.getState().setColorNotes();
  if (type === "notebook") {
    useNotebookStore.getState().refresh();
  }
  useMenuStore.getState().setMenuPins();
};

export const openLinkInBrowser = async (link: string) => {
  Linking.openURL(link);
};

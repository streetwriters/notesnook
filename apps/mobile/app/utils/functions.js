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
import { eSendEvent, ToastEvent } from "../services/event-manager";
import Navigation from "../services/navigation";
import SearchService from "../services/search";
import { useMenuStore } from "../stores/use-menu-store";
import { useRelationStore } from "../stores/use-relation-store";
import { useSelectionStore } from "../stores/use-selection-store";
import { eClearEditor, eOnTopicSheetUpdate } from "./events";

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

export const deleteItems = async (item, context) => {
  if (item && db.monographs.isPublished(item.id)) {
    ToastEvent.show({
      heading: "Can not delete note",
      message: "Unpublish note to delete it",
      type: "error",
      context: "global"
    });
    return;
  }

  const selectedItemsList = item
    ? [item]
    : useSelectionStore.getState().selectedItemsList;

  let notes = selectedItemsList.filter((i) => i.type === "note");
  let notebooks = selectedItemsList.filter((i) => i.type === "notebook");
  let topics = selectedItemsList.filter((i) => i.type === "topic");
  let reminders = selectedItemsList.filter((i) => i.type === "reminder");

  if (reminders.length > 0) {
    for (let reminder of reminders) {
      await db.reminders.remove(reminder.id);
    }
    useRelationStore.getState().update();
  }

  if (notes?.length > 0) {
    for (const note of notes) {
      if (db.monographs.isPublished(note.id)) {
        ToastEvent.show({
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

  if (topics?.length > 0) {
    const result = await confirmDeleteAllNotes(topics, "topic", context);
    if (!result.delete) return;
    for (const topic of topics) {
      if (result.deleteNotes) {
        const notes = db.notebooks
          .notebook(topic.notebookId)
          .topics.topic(topic.id).all;
        await db.notes.delete(...notes.map((note) => note.id));
      }
      await db.notebooks.notebook(topic.notebookId).topics.delete(topic.id);
    }
    useMenuStore.getState().setMenuPins();
    ToastEvent.show({
      heading: `${topics.length > 1 ? "Topics" : "Topic"} deleted`,
      type: "success"
    });
  }

  if (notebooks?.length > 0) {
    const result = await confirmDeleteAllNotes(notebooks, "notebook", context);
    if (!result.delete) return;
    let ids = notebooks.map((i) => i.id);
    if (result.deleteNotes) {
      for (let id of ids) {
        const notebook = db.notebooks.notebook(id);
        const topics = notebook.topics.all;
        for (let topic of topics) {
          const notes = db.notebooks
            .notebook(topic.notebookId)
            .topics.topic(topic.id).all;
          await db.notes.delete(...notes.map((note) => note.id));
        }
        const notes = db.relations.from(notebook.data, "note");
        await db.notes.delete(...notes.map((note) => note.id));
      }
    }
    await db.notebooks.delete(...ids);
    useMenuStore.getState().setMenuPins();
  }

  Navigation.queueRoutesForUpdate();

  let message = `${selectedItemsList.length} ${
    selectedItemsList.length === 1 ? "item" : "items"
  } moved to trash.`;

  let deletedItems = [...selectedItemsList];
  if (
    topics.length === 0 &&
    reminders.length === 0 &&
    (notes.length > 0 || notebooks.length > 0)
  ) {
    ToastEvent.show({
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
        ToastEvent.hide();
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
  eSendEvent(eOnTopicSheetUpdate);
};

export const openLinkInBrowser = async (link) => {
  try {
    Linking.openURL(link);
  } catch (error) {
    console.log(error.message);
  }
};

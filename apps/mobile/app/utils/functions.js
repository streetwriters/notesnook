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
import { history } from ".";
import { eSendEvent, ToastEvent } from "../services/event-manager";
import Navigation from "../services/navigation";
import SearchService from "../services/search";
import { useSelectionStore } from "../stores/use-selection-store";
import { useMenuStore } from "../stores/use-menu-store";
import { db } from "../common/database";
import { eClearEditor, eOnTopicSheetUpdate } from "./events";
import { useRelationStore } from "../stores/use-relation-store";
import { presentDialog } from "../components/dialog/functions";

function deleteConfirmDialog(items, type, context) {
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
  if (item && item.id && history.selectedItemsList.length === 0) {
    history.selectedItemsList = [];
    history.selectedItemsList.push(item);
  }

  let notes = history.selectedItemsList.filter((i) => i.type === "note");
  let notebooks = history.selectedItemsList.filter(
    (i) => i.type === "notebook"
  );
  let topics = history.selectedItemsList.filter((i) => i.type === "topic");
  let reminders = history.selectedItemsList.filter(
    (i) => i.type === "reminder"
  );

  let routesForUpdate = [
    "TaggedNotes",
    "ColoredNotes",
    "TopicNotes",
    "Favorites",
    "Notes"
  ];

  if (reminders.length > 0) {
    for (let reminder of reminders) {
      await db.reminders.remove(reminder.id);
    }
    routesForUpdate.push("Reminders");
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
    routesForUpdate.push("Trash");
    eSendEvent(eClearEditor);
  }

  if (topics?.length > 0) {
    const result = await deleteConfirmDialog(topics, "topic", context);
    if (result.delete) {
      for (const topic of topics) {
        if (result.deleteNotes) {
          const notes = db.notebooks
            .notebook(topic.notebookId)
            .topics.topic(topic.id).all;
          await db.notes.delete(...notes.map((note) => note.id));
        }
        await db.notebooks.notebook(topic.notebookId).topics.delete(topic.id);
      }
      routesForUpdate.push("Notebook", "Notebooks");
      useMenuStore.getState().setMenuPins();
      ToastEvent.show({
        heading: `${topics.length > 1 ? "Topics" : "Topic"} deleted`,
        type: "success"
      });
    }
  }

  if (notebooks?.length > 0) {
    const result = await deleteConfirmDialog(notebooks, "notebook", context);

    if (result.delete) {
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
      routesForUpdate.push("Notebook", "Notebooks");
      useMenuStore.getState().setMenuPins();
    }
  }

  Navigation.queueRoutesForUpdate(...routesForUpdate);

  let msgPart = history.selectedItemsList.length === 1 ? " item" : " items";
  let message = history.selectedItemsList.length + msgPart + " moved to trash.";

  let itemsCopy = [...history.selectedItemsList];
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
        for (var i = 0; i < itemsCopy.length; i++) {
          let it = itemsCopy[i];
          let trashItem = trash.find((item) => item.id === it.id);
          ids.push(trashItem.id);
        }
        await db.trash.restore(...ids);

        Navigation.queueRoutesForUpdate(routesForUpdate);
        useMenuStore.getState().setMenuPins();
        useMenuStore.getState().setColorNotes();
        ToastEvent.hide();
      },
      actionText: "Undo"
    });
  }
  history.selectedItemsList = [];
  Navigation.queueRoutesForUpdate("Trash");
  useSelectionStore.getState().clearSelection(true);
  useMenuStore.getState().setMenuPins();
  useMenuStore.getState().setColorNotes();
  SearchService.updateAndSearch();
  eSendEvent(eOnTopicSheetUpdate);
};

export const openLinkInBrowser = async (link) => {
  try {
    const url = link;
    Linking.openURL(url);
  } catch (error) {
    console.log(error.message);
  }
};

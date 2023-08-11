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

import React from "react";
import { NotebookItem } from ".";
import { TopicNotes } from "../../../screens/notes/topic-notes";
import { ToastEvent } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { useTrashStore } from "../../../stores/use-trash-store";
import { db } from "../../../common/database";
import { presentDialog } from "../../dialog/functions";
import SelectionWrapper from "../selection-wrapper";

const navigateToNotebook = (item, canGoBack) => {
  if (!item) return;

  Navigation.navigate(
    {
      title: item.title,
      name: "Notebook",
      id: item.id,
      type: "notebook"
    },
    {
      title: item.title,
      item: item,
      canGoBack
    }
  );
};

export const openNotebookTopic = (item) => {
  const isTrash = item.type === "trash";
  const { selectedItemsList, setSelectedItem, selectionMode, clearSelection } =
    useSelectionStore.getState();
  if (selectedItemsList.length > 0 && selectionMode) {
    setSelectedItem(item);
    return;
  } else {
    clearSelection();
  }

  if (isTrash) {
    presentDialog({
      title: `Restore ${item.itemType}`,
      paragraph: `Restore or delete ${item.itemType} forever`,
      positiveText: "Restore",
      negativeText: "Delete",
      positivePress: async () => {
        await db.trash.restore(item.id);
        Navigation.queueRoutesForUpdate();
        useSelectionStore.getState().setSelectionMode(false);
        ToastEvent.show({
          heading: "Restore successful",
          type: "success"
        });
      },
      onClose: async () => {
        await db.trash.delete(item.id);
        useTrashStore.getState().setTrash();
        useSelectionStore.getState().setSelectionMode(false);
        ToastEvent.show({
          heading: "Permanently deleted items",
          type: "success",
          context: "local"
        });
      }
    });
    return;
  }
  if (item.type === "topic") {
    TopicNotes.navigate(item, true);
  } else {
    navigateToNotebook(item, true);
  }
};

export const NotebookWrapper = React.memo(
  function NotebookWrapper({ item, index, dateBy, totalNotes }) {
    const isTrash = item.type === "trash";

    return (
      <SelectionWrapper
        pinned={item.pinned}
        index={index}
        onPress={() => openNotebookTopic(item)}
        height={item.type === "topic" ? 80 : 110}
        item={item}
      >
        <NotebookItem
          isTopic={item.type === "topic"}
          item={item}
          dateBy={dateBy}
          index={index}
          isTrash={isTrash}
          totalNotes={totalNotes}
        />
      </SelectionWrapper>
    );
  },
  (prev, next) => {
    if (prev.totalNotes !== next.totalNotes) return false;
    if (prev.item.title !== next.item.title) return false;
    if (prev.dateBy !== next.dateBy) {
      return false;
    }

    if (prev.item?.dateEdited !== next.item?.dateEdited) {
      return false;
    }
    if (JSON.stringify(prev.item) !== JSON.stringify(next.item)) {
      return false;
    }

    return true;
  }
);

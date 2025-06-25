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

import { BaseTrashItem, Notebook } from "@notesnook/core";
import React from "react";
import { NotebookItem } from ".";
import { db } from "../../../common/database";
import NotebookScreen from "../../../screens/notebook";
import { ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { useTrashStore } from "../../../stores/use-trash-store";
import { presentDialog } from "../../dialog/functions";
import SelectionWrapper, { selectItem } from "../selection-wrapper";
import { strings } from "@notesnook/intl";

export const openNotebook = (item: Notebook | BaseTrashItem<Notebook>) => {
  const isTrash = item.type === "trash";

  if (selectItem(item)) return;

  if (isTrash) {
    presentDialog({
      title: strings.restoreNotebook(),
      positiveText: strings.restore(),
      negativeText: strings.delete(),
      positivePress: async () => {
        if ((await db.trash.restore(item.id)) === false) return;
        Navigation.queueRoutesForUpdate();
        useSelectionStore.getState().setSelectionMode(undefined);
        ToastManager.show({
          heading: strings.notebookRestored(),
          type: "success"
        });
      },
      onClose: async () => {
        await db.trash.delete(item.id);
        useTrashStore.getState().refresh();
        useSelectionStore.getState().setSelectionMode(undefined);
        ToastManager.show({
          heading: strings.permanentlyDeletedNotebook(),
          type: "success",
          context: "local"
        });
      }
    });
    return;
  }
  NotebookScreen.navigate(item, true);
};

type NotebookWrapperProps = {
  item: Notebook | BaseTrashItem<Notebook>;
  totalNotes: number;
  date: number;
  index: number;
};

export const NotebookWrapper = React.memo(
  function NotebookWrapper({
    item,
    index,
    date,
    totalNotes
  }: NotebookWrapperProps) {
    const isTrash = item.type === "trash";

    return (
      <SelectionWrapper onPress={() => openNotebook(item)} item={item}>
        <NotebookItem
          item={item}
          date={date}
          index={index}
          isTrash={isTrash}
          totalNotes={totalNotes}
        />
      </SelectionWrapper>
    );
  },
  (prev, next) => {
    if (prev.totalNotes !== next.totalNotes) return false;
    if (prev.date !== next.date) return false;
    if (prev.item?.dateModified !== next.item?.dateModified) return false;
    if (prev.item?.id !== next.item?.id) return false;

    return true;
  }
);

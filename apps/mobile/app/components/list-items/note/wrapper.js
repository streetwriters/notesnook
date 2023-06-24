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
import NoteItem from ".";
import { notesnook } from "../../../../e2e/test.ids";
import { db } from "../../../common/database";
import { DDS } from "../../../services/device-detection";
import {
  eSendEvent,
  hideSheet,
  openVault,
  presentSheet
} from "../../../services/event-manager";
import { useEditorStore } from "../../../stores/use-editor-store";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { eOnLoadNote, eShowMergeDialog } from "../../../utils/events";
import { tabBarRef } from "../../../utils/global-refs";
import { presentDialog } from "../../dialog/functions";
import NotePreview from "../../note-history/preview";
import SelectionWrapper from "../selection-wrapper";

const present = () =>
  presentDialog({
    title: "Note not synced",
    negativeText: "Ok",
    paragraph: "Please sync again to open this note for editing"
  });

export const openNote = async (item, isTrash, setSelectedItem, isSheet) => {
  let _note = item;
  if (isSheet) hideSheet();
  if (!isTrash) {
    _note = db.notes.note(item.id).data;
    if (!db.notes.note(item.id)?.synced()) {
      present();
      return;
    }
  } else {
    if (!db.trash.synced(item.id)) {
      present();
      return;
    }
  }
  const { selectedItemsList, selectionMode, clearSelection } =
    useSelectionStore.getState();

  if (selectedItemsList.length > 0 && selectionMode) {
    setSelectedItem && setSelectedItem(_note);
    return;
  } else {
    clearSelection();
  }

  if (!_note.conflicted) {
    eSendEvent(eShowMergeDialog, _note);
    return;
  }

  if (_note.locked) {
    openVault({
      item: _note,
      novault: true,
      locked: true,
      goToEditor: true,
      title: "Open note",
      description: "Unlock note to open it in editor."
    });
    return;
  }
  if (isTrash) {
    const content = await db.content.get(item.contentId);
    presentSheet({
      component: (
        <NotePreview note={item} content={{ type: "tiptap", data: content }} />
      )
    });
  } else {
    useEditorStore.getState().setReadonly(_note?.readonly);
    eSendEvent(eOnLoadNote, _note);
    if (!DDS.isTab) {
      tabBarRef.current?.goToPage(1);
    }
  }
};

export const NoteWrapper = React.memo(
  function NoteWrapper({ item, index, dateBy, isSheet }) {
    const isTrash = item.type === "trash";
    const setSelectedItem = useSelectionStore((state) => state.setSelectedItem);

    return (
      <SelectionWrapper
        index={index}
        height={100}
        testID={notesnook.ids.note.get(index)}
        onPress={() => openNote(item, isTrash, setSelectedItem, isSheet)}
        isSheet={isSheet}
        item={item}
      >
        <NoteItem item={item} dateBy={dateBy} isTrash={isTrash} />
      </SelectionWrapper>
    );
  },
  (prev, next) => {
    if (prev.dateBy !== next.dateBy) {
      return false;
    }
    if (prev.item?.dateEdited !== next.item?.dateEdited) {
      return false;
    }

    if (prev.item !== next.item) {
      return false;
    }

    return true;
  }
);

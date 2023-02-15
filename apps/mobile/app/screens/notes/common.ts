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

import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { eSendEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import { NotesScreenParams } from "../../stores/use-navigation-store";
import { useTagStore } from "../../stores/use-tag-store";
import { eOnLoadNote } from "../../utils/events";
import { openLinkInBrowser } from "../../utils/functions";
import { tabBarRef } from "../../utils/global-refs";
import { TopicType } from "../../utils/types";
import { editorController, editorState } from "../editor/tiptap/utils";

export function toCamelCase(title: string) {
  if (!title) return "";
  return title.slice(0, 1).toUpperCase() + title.slice(1);
}

export function getAlias(params: Partial<NotesScreenParams>) {
  if (!params) return "";
  const { item } = params;
  return (item as TopicType)?.alias || item?.title || "";
}

export function openMonographsWebpage() {
  try {
    openLinkInBrowser("https://docs.notesnook.com/monographs/");
  } catch (e) {
    console.error(e);
  }
}

export function openEditor() {
  if (!DDS.isTab) {
    if (editorController.current?.note) {
      eSendEvent(eOnLoadNote, { type: "new" });
      editorState().currentlyEditing = true;
      editorState().movedAway = false;
    }
    tabBarRef.current?.goToPage(1);
  } else {
    eSendEvent(eOnLoadNote, { type: "new" });
  }
}

type FirstSaveData = {
  type: string;
  id: string;
  notebook?: string;
  color?: string;
};

export const setOnFirstSave = (
  data: {
    type: string;
    id: string;
    notebook?: string;
    color?: string;
  } | null
) => {
  if (!data) {
    editorState().onNoteCreated = null;
    return;
  }
  editorState().onNoteCreated = (id) => onNoteCreated(id, data);
};

async function onNoteCreated(id: string, params: FirstSaveData) {
  if (!params) return;
  switch (params.type) {
    case "topic": {
      if (!params.notebook) break;
      await db.notes?.addToNotebook(
        {
          topic: params.id,
          id: params.notebook
        },
        id
      );
      editorState().onNoteCreated = null;
      Navigation.queueRoutesForUpdate(
        "TaggedNotes",
        "ColoredNotes",
        "TopicNotes",
        "Favorites",
        "Notes",
        "Notebook",
        "Notebooks"
      );
      break;
    }
    case "tag": {
      await db.notes?.note(id).tag(params.id);
      editorState().onNoteCreated = null;
      Navigation.queueRoutesForUpdate(
        "TaggedNotes",
        "ColoredNotes",
        "TopicNotes",
        "Favorites",
        "Notes"
      );
      useTagStore.getState().setTags();
      break;
    }
    case "color": {
      await db.notes?.note(id).color(params.color);
      editorState().onNoteCreated = null;
      Navigation.queueRoutesForUpdate(
        "TaggedNotes",
        "ColoredNotes",
        "TopicNotes",
        "Favorites",
        "Notes"
      );
      useMenuStore.getState().setColorNotes();
      break;
    }
    default: {
      break;
    }
  }
}

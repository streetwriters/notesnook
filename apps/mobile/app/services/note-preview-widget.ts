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
import { Note } from "@notesnook/core";
import { db } from "../common/database";
import { NotesnookModule } from "../utils/notesnook-module";
import { Platform } from "react-native";
import { IOSWidgets } from "./widgets/ios-widgets";
import { toWidgetNote } from "./pinned-notes-widget";
import { htmlToWidgetBlocks, NoteBlocks } from "./widgets/note-blocks";

type PreviewNote = ReturnType<typeof toWidgetNote> & Partial<NoteBlocks>;

async function getContentBlocks(note: Note): Promise<Partial<NoteBlocks>> {
  if (note.locked || !note.contentId) return {};
  try {
    const content = await db.content.get(note.contentId);
    if (!content || content.locked || typeof content.data !== "string") {
      return {};
    }
    return htmlToWidgetBlocks(content.data);
  } catch {
    return {};
  }
}

async function toPreviewNote(note: Note): Promise<PreviewNote> {
  return { ...toWidgetNote(note), ...(await getContentBlocks(note)) };
}

async function serializeAndroidNote(note: Note) {
  return JSON.stringify({ ...note, ...(await getContentBlocks(note)) });
}

const MAX_IOS_PREVIEW_NOTES = 20;

function publishIOSNotes(notes: PreviewNote[]) {
  IOSWidgets.publish("previewNotes", notes, ["NotePreviewWidget"]);
}

async function updateIOSNotes() {
  const stored = IOSWidgets.read<PreviewNote[]>("previewNotes", []);
  if (!stored.length) return;

  const updated: PreviewNote[] = [];
  for (const item of stored) {
    const note = await db.notes.note(item.id);
    if (note) updated.push(await toPreviewNote(note));
  }
  publishIOSNotes(updated);
}

let timer: NodeJS.Timeout;
export const NotePreviewWidget = {
  updateNotes: () => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (Platform.OS === "ios") {
        try {
          await updateIOSNotes();
        } catch (err) {
          console.error("Failed to update note widgets:", err);
        }
        return;
      }
      const noteIds = await NotesnookModule.getWidgetNotes();
      for (const id of noteIds) {
        const newNote = await db.notes.note(id);
        if (!newNote) continue;

        NotesnookModule.updateWidgetNote(
          id,
          await serializeAndroidNote(newNote)
        );
      }
      // Redraw from the widgets that actually exist rather than only the ones we
      // have notes for. After app data is cleared there are none, and the widgets
      // would otherwise keep showing content that no longer exists.
      NotesnookModule.refreshWidgets();
    }, 500);
  },
  addNote: async (note: Note) => {
    if (Platform.OS !== "ios") return;
    const stored = IOSWidgets.read<PreviewNote[]>("previewNotes", []);
    publishIOSNotes(
      [
        await toPreviewNote(note),
        ...stored.filter((item) => item.id !== note.id)
      ].slice(0, MAX_IOS_PREVIEW_NOTES)
    );
  },
  serializeNote: serializeAndroidNote,
  updateNote: async (id: string, note: Note) => {
    if (Platform.OS === "ios") {
      NotePreviewWidget.updateNotes();
      return;
    }
    if (Platform.OS !== "android") return;
    if (id && (await NotesnookModule.hasWidgetNote(id))) {
      NotesnookModule.updateWidgetNote(id, await serializeAndroidNote(note));
    }
  }
};

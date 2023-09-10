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

import { useEffect, useState } from "react";
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";
import { useEditorStore } from "../stores/use-editor-store";
import { useTagStore } from "../stores/use-tag-store";
import { db } from "../common/database";
import { NoteType } from "app/utils/types";
import { useCallback } from "react";

/**
 * A hook that injects/removes tags from tags bar in editor
 */
const useEditorTags = () => {
  const currentEditingNote = useEditorStore(
    (state) => state.currentEditingNote
  );
  const tags = useTagStore((state) => state.tags);
  const [note, setNote] = useState<NoteType | null>(null);
  const [noteTags, setNoteTags] = useState<string[]>([]);

  const refreshNote = useCallback(() => {
    const current = useEditorStore.getState().currentEditingNote;
    if (!current) {
      setNote(null);
      setNoteTags([]);
      return;
    }
    const note = db.notes?.note(current)?.data as NoteType;
    setNote(note ? { ...note } : null);
    getTags(note);
  }, []);

  useEffect(() => {
    refreshNote();
  }, [currentEditingNote, refreshNote, tags]);

  const load = useCallback(() => {
    if (!note) return;
    //  tiny.call(EditorWebView, renderTags(noteTags));
  }, [note]);

  useEffect(() => {
    eSubscribeEvent("updateTags", load);
    return () => {
      eUnSubscribeEvent("updateTags", load);
    };
  }, [load, noteTags]);

  function getTags(note: NoteType) {
    if (!note || !note.tags) return [];
    const tags = note.tags
      .map((t) => (db.tags?.tag(t) ? { ...db.tags.tag(t) } : null))
      .filter((t) => t !== null);
    setNoteTags(tags);
  }

  useEffect(() => {
    load();
  }, [load, noteTags]);

  return [];
};

export default useEditorTags;

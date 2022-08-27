import { useEffect, useState } from "react";
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";
import { useEditorStore } from "../stores/use-editor-store";
import { useTagStore } from "../stores/use-tag-store";
import { db } from "../common/database";
import { NoteType } from "app/utils/types";

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

  async function refreshNote() {
    const current = useEditorStore.getState().currentEditingNote;
    if (!current) {
      setNote(null);
      setNoteTags([]);
      return;
    }
    const note = db.notes?.note(current)?.data as NoteType;
    setNote(note ? { ...note } : null);
    getTags(note);
  }

  useEffect(() => {
    refreshNote();
  }, [currentEditingNote, tags]);

  function load() {
    if (!note) return;
    //  tiny.call(EditorWebView, renderTags(noteTags));
  }

  useEffect(() => {
    eSubscribeEvent("updateTags", load);
    return () => {
      eUnSubscribeEvent("updateTags", load);
    };
  }, [noteTags]);

  function getTags(note: NoteType) {
    if (!note || !note.tags) return [];
    const tags = note.tags
      .map((t) => (db.tags?.tag(t) ? { ...db.tags.tag(t) } : null))
      .filter((t) => t !== null);
    setNoteTags(tags);
  }

  useEffect(() => {
    load();
  }, [noteTags]);

  return [];
};

export default useEditorTags;

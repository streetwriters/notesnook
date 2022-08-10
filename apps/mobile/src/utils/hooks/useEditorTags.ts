import { useEffect, useState } from 'react';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { useEditorStore } from '../../stores/use-editor-store';
import { useTagStore } from '../../stores/use-tag-store';
import { db } from '../database';

/**
 * A hook that injects/removes tags from tags bar in editor
 */
const useEditorTags = () => {
  const currentEditingNote = useEditorStore(state => state.currentEditingNote);
  const tags = useTagStore(state => state.tags);
  const [note, setNote] = useState<any>(null);
  const [noteTags, setNoteTags] = useState([]);

  async function refreshNote() {
    let current = useEditorStore.getState().currentEditingNote;
    if (!current) {
      setNote(null);
      setNoteTags([]);
      return;
    }
    let note = db.notes?.note(current)?.data;
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
    eSubscribeEvent('updateTags', load);
    return () => {
      eUnSubscribeEvent('updateTags', load);
    };
  }, [noteTags]);

  function getTags(note: any) {
    if (!note || !note.tags) return [];
    let tags = note.tags
      .map((t: any) => (db.tags?.tag(t) ? { ...db.tags.tag(t) } : null))
      .filter((t: any) => t !== null);
    setNoteTags(tags);
  }

  useEffect(() => {
    load();
  }, [noteTags]);

  return [];
};

export default useEditorTags;

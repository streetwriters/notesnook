import {useEffect, useState} from 'react';
import {useEditorStore, useTagStore} from '../../provider/stores';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {db} from '../../utils/database';
import {EditorWebView} from './Functions';
import tiny from './tiny/tiny';

export const useEditorTags = () => {
  const currentEditingNote = useEditorStore(state => state.currentEditingNote);
  const tags = useTagStore(state => state.tags);
  const [note, setNote] = useState(null);
  const [noteTags, setNoteTags] = useState([]);

  async function refreshNote() {
    let current = useEditorStore.getState().currentEditingNote;
    if (!current) {
      setNote(null);
      setNoteTags([]);
      return;
    }
    let note = db.notes.note(current)?.data;
    setNote(note ? {...note} : null);
    getTags(note);
  }

  useEffect(() => {
    refreshNote();
  }, [currentEditingNote, tags]);

  function load() {
      if (!note) return;
      tiny.call(EditorWebView, renderTags(noteTags));
  }

  useEffect(() => {
    eSubscribeEvent('updateTags', load);
    return () => {
      eUnSubscribeEvent('updateTags', load);
    };
  }, [noteTags]);

  function getTags(note) {
    if (!note || !note.tags) return [];
    let tags = note.tags
      .map(t => (db.tags.tag(t) ? {...db.tags.tag(t)} : null))
      .filter(t => t !== null);
    setNoteTags(tags);
  }

  useEffect(() => {
    load()
  }, [noteTags]);

  const hideTagBar = `
    toggleNode(".tag-bar-parent","hide"); 
    clearNode(".tag-bar")`;
  const showTagBar = `
    toggleNode(".tag-bar-parent","show");
    clearNode(".tag-bar")`;
  const clearNode = `clearNode(".tag-bar")`;
  const renderTags = tags => `(function() {
      clearNode(".tag-bar");
      toggleNode(".tag-bar-parent","show")
      let items = ${JSON.stringify(tags)};
      renderChildernInNode(items, ".tag-bar", "div", ["tag","noselect"]);
    })();`;

  return [];
};

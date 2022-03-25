import { useCallback, useEffect, useRef, useState } from 'react';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../../services/event-manager';
import { useEditorStore } from '../../../stores/stores';
import { editing } from '../../../utils';
import { db } from '../../../utils/database';
import { eOnLoadNote } from '../../../utils/events';
import { timeConverter } from '../../../utils/time';
import Commands from './commands';
import { EditorEvents, isEditorLoaded, makeSessionId, post } from './utils';

export const useEditor = () => {
  const [loading, setLoading] = useState(false);
  const sessionId = useEditorStore(state => state.sessionId);
  const editorRef = useRef();
  const currentNote = useRef();
  const currentContent = useRef();
  const postMessage = async (type, data) => await post(editorRef, type, data);
  const timers = useRef({});
  const commands = new Commands(editorRef);
  const sessionHistoryId = useRef();

  useEffect(() => {
    console.log('sessionId:', sessionId);
    commands.setSessionId(sessionId);
    if (sessionId) {
      (async () => {
        if (!(await isEditorLoaded(editorRef))) {
          console.log('should reload');
          setLoading(true);
        }
      })();
    }
  }, [sessionId, loading]);

  useEffect(() => {
    if (loading) {
      setLoading(false);
    }
  }, [loading]);

  const withTimer = (id, fn, duration) => {
    clearTimeout(id);
    timers.current[id] = setTimeout(fn, duration);
  };

  const reset = () => {
    currentNote.current = null;
    currentContent.current = null;
    useEditorStore.getState().setCurrentlyEditingNote(null);
    commands.clearContent();
  };

  async function saveNote(title, id, data, type, sessionId) {
    console.log('saving note', id);
    try {
      if (id && !db.notes.note(id)) {
        useEditorStore.getState().setCurrentlyEditingNote(null);
        return;
      }
      let note = id && db.notes.note(id)?.data;
      let locked = note?.locked;
      if (note?.conflicted) return;

      if (!sessionHistoryId.current) {
        if (note) {
          sessionHistoryId.current = note.dateEdited;
        } else {
          sessionHistoryId.current = Date.now();
        }
      }

      let noteData = {
        id,
        sessionId: sessionHistoryId.current
      };

      if (title) {
        noteData.title = title;
      }

      if (data) {
        noteData.content = {
          data: data,
          type: type
        };
      }

      if (!locked) {
        id = await db.notes.add(noteData);
        if (!note) currentNote.current = db.notes.note(id).data;

        if (useEditorStore.getState().currentEditingNote !== id) {
          setTimeout(() => {
            useEditorStore.getState().setCurrentlyEditingNote(id);
          });
        }
      } else {
        noteData.contentId = note.contentId;
        await db.vault.save(noteData);
      }

      commands.setStatus(timeConverter(db.notes.note(id)?.data?.dateEdited), 'Saved');

      return id;

      //let n = db.notes.note(id)?.data?.dateEdited;
      // tiny.call(EditorWebView, tiny.updateDateEdited(n ? timeConverter(n) : ''));
      // tiny.call(EditorWebView, tiny.updateSavingState(!n ? '' : 'Saved'));
    } catch (e) {
      console.log('error saving: ', e);
    }
  }

  const loadContent = async note => {
    currentNote.current = note;
    if (note.locked) {
      currentContent.current = {
        data: note.content.data,
        type: note.content.type
      };
    } else {
      let data = await db.content.raw(note.contentId);
      if (data) {
        data = await db.content.insertPlaceholders(data, 'placeholder.svg');
        currentContent.current = {
          data: data.data,
          type: data.type
        };
      }
    }
  };

  const loadNote = async item => {
    console.log('loading note', item.type);
    editing.currentlyEditing = true;
    const editorState = useEditorStore.getState();

    if (item && item.type === 'new') {
      currentNote.current && reset();
      editorState.setSessionId(makeSessionId());
      commands.focus();
    } else {
      if (!item.forced && currentNote.current?.id === item.id) return;
      currentNote.current && reset();
      await loadContent(item);
      editorState.setSessionId(makeSessionId(item));
      editorState.setCurrentlyEditingNote(item.id);
      currentNote.current = item;
      commands.setStatus(timeConverter(item.dateEdited), 'Saved');
      await postMessage(EditorEvents.title, item.title);
      await postMessage(EditorEvents.html, currentContent.current?.data);
    }
  };

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote, loadNote);
    return () => {
      eUnSubscribeEvent(eOnLoadNote, loadNote);
    };
  }, []);

  const onMessage = useCallback(
    event => {
      let message = event.nativeEvent.data;
      message = JSON.parse(message);

      console.log(message.type);

      if (message.sessionId !== sessionId && message.type !== EditorEvents.status) {
        console.log(
          'useEditor: message recieved from invalid session',
          message.type,
          sessionId,
          message.sessionId
        );
        return;
      }
      switch (message.type) {
        case EditorEvents.logger:
          console.log(message.type, message.value);
          break;
        case 'editor-event:content':
          saveContent(null, message.value);
          break;
        case 'editor-event:selection':
          break;
        case 'editor-event:title':
          saveContent(message.value);
          break;
      }
      if (message.type.startsWith('native:')) {
        eSendEvent(message.type, message);
      }
    },
    [sessionId]
  );

  const saveContent = (title, content) => {
    currentContent.current = {
      data: content,
      type: 'tiny'
    };
    let params = [title, currentNote.current?.id, content, 'tiny', sessionId];
    withTimer(currentNote.current?.id, () => saveNote(...params));
  };

  const onLoad = () => {
    console.log('on editor load');
    if (currentNote.current) {
      console.log('force reload note');
      loadNote({ ...currentNote.current, forced: true });
    }
  };

  return { onMessage, ref: editorRef, onLoad, commands, reset, loading, setLoading };
};

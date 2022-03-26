import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WebView from 'react-native-webview';
import { DDS } from '../../../services/device-detection';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../../services/event-manager';
import { useEditorStore } from '../../../stores/stores';
import { useThemeStore } from '../../../stores/theme';
import { db } from '../../../utils/database';
import { MMKV } from '../../../utils/database/mmkv';
import { eOnLoadNote } from '../../../utils/events';
import { tabBarRef } from '../../../utils/global-refs';
import { timeConverter } from '../../../utils/time';
import Commands from './commands';
import { EditorState } from './types';
import { defaultState, EditorEvents, isEditorLoaded, makeSessionId, post } from './utils';

type Note = {
  [name: string]: any;
  id: string | null;
  type: string;
  contentId: string;
  title: string;
  locked: boolean;
  conflicted: boolean;
  dateEdited: number;
};

type Content = {
  data?: string;
  type: string;
};

type SavePayload = {
  title?: string;
  id?: string | null;
  data?: Content['data'];
  type?: Content['type'];
  sessionId?: string | null;
};

export const useEditor = () => {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(makeSessionId());
  const editorRef = useRef<WebView>();
  const currentNote = useRef<Note | null>();
  const currentContent = useRef<Content | null>();
  const timers = useRef<{ [name: string]: NodeJS.Timeout }>({});
  const commands = useMemo(() => new Commands(editorRef), []);
  const sessionHistoryId = useRef<number>();
  const state = useRef<Partial<EditorState>>(defaultState);
  console.log('state: ', defaultState);
  const postMessage = useCallback(
    async (type: string, data: any) => await post(editorRef, type, data),
    []
  );

  useEffect(() => {
    let unsub = useThemeStore.subscribe(state => {
      postMessage(EditorEvents.theme, state.colors);
    });

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    console.log('sessionId:', sessionId);
    commands.setSessionId(sessionId);
    if (sessionId) {
      (async () => {
        if (!state.current?.ready) return;
        onReady();
      })();
    }
  }, [sessionId, loading]);

  const overlay = (show: boolean, data = { type: 'new' }) => {
    eSendEvent('loadingNote', show ? currentNote.current || data : false);
  };

  const onReady = useCallback(async () => {
    if (!(await isEditorLoaded(editorRef))) {
      console.log('reload editor');
      overlay(true);
      setLoading(true);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      setLoading(false);
    }
  }, [loading]);

  const withTimer = useCallback((id: string, fn: () => void, duration: number) => {
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(fn, duration);
  }, []);

  const reset = useCallback(() => {
    currentNote.current = null;
    currentContent.current = null;
    useEditorStore.getState().setCurrentlyEditingNote(null);
    commands.clearContent();
  }, []);

  const saveNote = useCallback(
    async ({ title, id, data, type, sessionId: currentSessionId }: SavePayload) => {
      console.log('saving note', id);
      try {
        if (id && !db.notes?.note(id)) {
          useEditorStore.getState().setCurrentlyEditingNote(null);
          reset();
          return;
        }
        let note = id ? (db.notes?.note(id)?.data as Note) : null;
        let locked = note?.locked;
        if (note?.conflicted) return;

        if (!sessionHistoryId.current) {
          if (note) {
            sessionHistoryId.current = note.dateEdited;
          } else {
            sessionHistoryId.current = Date.now();
          }
        }

        let noteData: Partial<Note> = {
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
          id = await db.notes?.add(noteData);
          if (!note && id) {
            currentNote.current = db.notes?.note(id).data as Note;
            state.current?.onNoteCreated && state.current.onNoteCreated(id);
          }

          if (useEditorStore.getState().currentEditingNote !== id) {
            setTimeout(() => {
              id && useEditorStore.getState().setCurrentlyEditingNote(id);
            });
          }
        } else {
          //@ts-ignore
          noteData.contentId = note.contentId;
          //@ts-ignore
          await db.vault?.save(noteData);
        }
        if (id && sessionId === currentSessionId) {
          note = db.notes?.note(id)?.data as Note;
          commands.setStatus(timeConverter(note.dateEdited), 'Saved');
        }

        return id;
      } catch (e) {
        console.log('error saving: ', e);
      }
    },
    [commands, reset]
  );

  const loadContent = useCallback(async (note: Note) => {
    currentNote.current = note;
    if (note.locked) {
      currentContent.current = {
        data: note.content.data,
        type: note.content.type
      };
    } else {
      let data = await db.content?.raw(note.contentId);
      if (data) {
        data = await db.content?.insertPlaceholders(data, 'placeholder.svg');
        currentContent.current = {
          data: data.data,
          type: data.type
        };
      }
    }
  }, []);

  const loadNote = useCallback(
    async (item: Note) => {
      console.log('loading note', item.type);
      state.current.currentlyEditing = true;
      const editorState = useEditorStore.getState();

      if (item && item.type === 'new') {
        currentNote.current && reset();
        setSessionId(makeSessionId());
        commands.focus();
      } else {
        if (!item.forced && currentNote.current?.id === item.id) return;
        overlay(true, item);
        currentNote.current && reset();
        await loadContent(item);
        setSessionId(makeSessionId(item));
        editorState.setCurrentlyEditingNote(item.id);
        currentNote.current = item;
        commands.setStatus(timeConverter(item.dateEdited), 'Saved');
        await postMessage(EditorEvents.title, item.title);
        await postMessage(EditorEvents.html, currentContent.current?.data);
        overlay(false);
      }
    },
    [setSessionId]
  );

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
          saveContent({
            type: message.type,
            content: message.value
          });
          break;
        case 'editor-event:selection':
          break;
        case 'editor-event:title':
          saveContent({
            type: message.type,
            title: message.value
          });
          break;
      }
      if (message.type.startsWith('native:')) {
        eSendEvent(message.type, message);
      }
    },
    [sessionId]
  );

  const saveContent = useCallback(
    ({ title, content, type }: { title?: string; content?: string; type: string }) => {
      if (type === EditorEvents.content) {
        currentContent.current = {
          data: content,
          type: 'tiny'
        };
      }
      let params = {
        title,
        data: content,
        type: 'tiptap',
        sessionId,
        id: currentNote.current?.id
      };

      withTimer(
        currentNote.current?.id || 'newnote',
        () => {
          if (currentNote.current && !params.id) {
            params.id = currentNote.current?.id;
          }
          saveNote(params);
        },
        300
      );
    },
    []
  );

  const onLoad = useCallback(() => {
    console.log('on editor load');
    state.current.ready = true;
    onReady();
    postMessage(EditorEvents.theme, useThemeStore.getState().colors);
    if (currentNote.current) {
      console.log('force reload note');
      loadNote({ ...currentNote.current, forced: true });
    } else {
      restoreEditorState();
    }
  }, [state, currentNote, loadNote]);

  async function restoreEditorState() {
    let appState = await MMKV.getItem('appState');
    if (appState) {
      appState = JSON.parse(appState);

      if (
        //@ts-ignore
        appState.editing &&
        //@ts-ignore
        appState.note &&
        //@ts-ignore
        !appState.note.locked &&
        //@ts-ignore
        appState.note.id &&
        //@ts-ignore
        Date.now() < appState.timestamp + 3600000
      ) {
        state.current.isRestoringState = true;
        //@ts-ignore
        overlay(true, appState.note);
        state.current.currentlyEditing = true;
        if (!DDS.isTab) {
          tabBarRef.current?.goToPage(1);
        }
        setTimeout(() => {
          //@ts-ignore
          loadNote(appState.note);
        }, 1);
        MMKV.removeItem('appState');
        state.current.movedAway = false;
        eSendEvent('load_overlay', 'hide_editor');
        state.current.isRestoringState = false;
        return;
      }
      state.current.isRestoringState = false;
      return;
    }
    state.current.isRestoringState = false;
  }

  return {
    onMessage,
    ref: editorRef,
    onLoad,
    commands,
    reset,
    loading,
    setLoading,
    state,
    sessionId,
    setSessionId,
    note: currentNote,
    onReady
  };
};

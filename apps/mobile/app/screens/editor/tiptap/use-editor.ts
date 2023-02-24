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

import { EVENTS } from "@notesnook/core/common";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WebView from "react-native-webview";
import { db } from "../../../common/database";
import useGlobalSafeAreaInsets from "../../../hooks/use-global-safe-area-insets";
import { DDS } from "../../../services/device-detection";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import SettingsService from "../../../services/settings";
import { TipManager } from "../../../services/tip-manager";
import { useEditorStore } from "../../../stores/use-editor-store";
import { useNoteStore } from "../../../stores/use-notes-store";
import { useTagStore } from "../../../stores/use-tag-store";
import { ThemeStore, useThemeStore } from "../../../stores/use-theme-store";
import { eClearEditor, eOnLoadNote } from "../../../utils/events";
import { tabBarRef } from "../../../utils/global-refs";
import { timeConverter } from "../../../utils/time";
import { NoteType } from "../../../utils/types";
import Commands from "./commands";
import { Content, EditorState, Note, SavePayload } from "./types";
import {
  clearAppState,
  defaultState,
  EditorEvents,
  getAppState,
  isContentInvalid,
  isEditorLoaded,
  makeSessionId,
  post
} from "./utils";

export const useEditor = (
  editorId = "",
  readonly?: boolean,
  onChange?: (html: string) => void,
  theme?: ThemeStore["colors"]
) => {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(makeSessionId());
  const sessionIdRef = useRef(sessionId);
  const editorRef = useRef<WebView>(null);
  const currentNote = useRef<NoteType | null>();
  const currentContent = useRef<Content | null>();
  const timers = useRef<{ [name: string]: NodeJS.Timeout }>({});
  const commands = useMemo(() => new Commands(editorRef), [editorRef]);
  const sessionHistoryId = useRef<number>();
  const state = useRef<Partial<EditorState>>(defaultState);
  const placeholderTip = useRef(TipManager.placeholderTip());
  const tags = useTagStore((state) => state.tags);
  const insets = useGlobalSafeAreaInsets();
  const isDefaultEditor = editorId === "";
  const saveCount = useRef(0);
  const lastContentChangeTime = useRef<number>(0);
  const lock = useRef(false);
  const attachedImages = useRef<{ [name: string]: any }>({});
  const loadedImages = useRef<{ [name: string]: any }>({});

  const postMessage = useCallback(
    async <T>(type: string, data: T) =>
      await post(editorRef, sessionIdRef.current, type, data),
    [sessionIdRef]
  );

  useEffect(() => {
    commands.setInsets(
      isDefaultEditor ? insets : { top: 0, left: 0, right: 0, bottom: 0 }
    );
  }, [commands, insets, isDefaultEditor]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    commands.setTags(currentNote.current);
  }, [commands, tags]);

  useEffect(() => {
    if (theme) return;
    const unsub = useThemeStore.subscribe((state) => {
      postMessage(EditorEvents.theme, state.colors);
    });

    return () => {
      unsub();
    };
  }, [postMessage, theme]);

  const overlay = useCallback(
    (show: boolean, data = { type: "new" }) => {
      eSendEvent(
        "loadingNote" + editorId,
        show ? data || currentNote.current : false
      );
    },
    [editorId]
  );

  const onReady = useCallback(async () => {
    if (!(await isEditorLoaded(editorRef, sessionIdRef.current))) {
      overlay(true);
      setLoading(true);
    }
  }, [overlay]);

  useEffect(() => {
    state.current.saveCount = 0;
    async () => {
      await commands.setSessionId(sessionIdRef.current);
      if (sessionIdRef.current) {
        if (!state.current?.ready) return;
        await onReady();
      }
    };
  }, [sessionId, loading, commands, onReady]);

  useEffect(() => {
    if (loading) {
      setLoading(false);
    }
  }, [loading]);

  const withTimer = useCallback(
    (id: string, fn: () => void, duration: number) => {
      clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(fn, duration);
    },
    []
  );

  const reset = useCallback(
    async (resetState = true) => {
      currentNote.current?.id && db.fs.cancel(currentNote.current.id);
      currentNote.current = null;
      attachedImages.current = [];
      currentContent.current = null;
      clearTimeout(timers.current["loading-images"]);
      sessionHistoryId.current = undefined;
      saveCount.current = 0;
      useEditorStore.getState().setReadonly(false);
      postMessage(EditorEvents.title, "");
      lastContentChangeTime.current = 0;
      await commands.clearContent();
      await commands.clearTags();
      if (resetState) {
        isDefaultEditor &&
          useEditorStore.getState().setCurrentlyEditingNote(null);
        placeholderTip.current = TipManager.placeholderTip();
        await commands.setPlaceholder(placeholderTip.current);
      }
    },
    [commands, isDefaultEditor, postMessage]
  );

  const saveNote = useCallback(
    async ({
      title,
      id,
      data,
      type,
      sessionId: currentSessionId,
      sessionHistoryId: currentSessionHistoryId
    }: SavePayload) => {
      if (
        readonly ||
        useEditorStore.getState().readonly ||
        currentNote.current?.readonly
      )
        return;
      try {
        if (id && !db.notes?.note(id)) {
          isDefaultEditor &&
            useEditorStore.getState().setCurrentlyEditingNote(null);
          await reset();
          return;
        }
        let note = id ? (db.notes?.note(id)?.data as Note) : null;
        const locked = note?.locked;
        if (note?.conflicted) return;

        if (isContentInvalid(data)) {
          // Create a new history session if recieved empty or invalid content
          // To ensure that history is preserved for correct content.
          sessionHistoryId.current = Date.now();
          currentSessionHistoryId = sessionHistoryId.current;
        }

        const noteData: Partial<Note> = {
          id,
          sessionId: isContentInvalid(data) ? null : currentSessionHistoryId
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
            currentNote.current = db.notes?.note(id).data as NoteType;
            state.current?.onNoteCreated && state.current.onNoteCreated(id);
            if (!noteData.title) {
              postMessage(
                EditorEvents.titleplaceholder,
                currentNote.current.title
              );
            }
          }

          if (
            useEditorStore.getState().currentEditingNote !== id &&
            isDefaultEditor
          ) {
            setTimeout(() => {
              id && useEditorStore.getState().setCurrentlyEditingNote(id);
            });
          }
        } else {
          noteData.contentId = note?.contentId;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await db.vault?.save(noteData as any);
        }
        if (id && sessionIdRef.current === currentSessionId) {
          note = db.notes?.note(id)?.data as Note;
          await commands.setStatus(timeConverter(note.dateEdited), "Saved");

          lastContentChangeTime.current = note.dateEdited;

          if (
            saveCount.current < 2 ||
            currentNote.current?.title !== note.title ||
            currentNote.current?.headline?.slice(0, 200) !==
              note.headline?.slice(0, 200)
          ) {
            Navigation.queueRoutesForUpdate(
              "ColoredNotes",
              "Notes",
              "TaggedNotes",
              "TopicNotes"
            );
          }
        }

        saveCount.current++;
        return id;
      } catch (e) {
        console.log("Error saving note: ", e);
      }
    },
    [commands, isDefaultEditor, postMessage, readonly, reset]
  );

  const loadContent = useCallback(async (note: NoteType) => {
    currentNote.current = note;
    if (note.locked || note.content) {
      currentContent.current = {
        data: note.content?.data,
        type: note.content?.type || "tiptap",
        noteId: currentNote.current?.id as string
      };
    } else {
      currentContent.current = await db.content?.raw(note.contentId);
    }
  }, []);

  const getImagesToLoad = () => {
    if (!currentNote.current?.id) return [];
    const currentImages = [
      ...(db.attachments?.ofNote(currentNote.current?.id, "images") || []),
      ...(db.attachments?.ofNote(currentNote.current?.id, "webclips") || [])
    ];
    if (!currentImages || currentImages?.length === 0) return [];
    const imagesToLoad: any[] = [];
    for (const image of currentImages) {
      if (!loadedImages.current[image.metadata.hash]) {
        loadedImages.current[image.metadata.hash] = false;
        imagesToLoad.push(image);
      }
      attachedImages.current[image.metadata.hash] = image;
    }
    return imagesToLoad;
  };

  const markImageLoaded = (hash: string) => {
    const attachment = attachedImages.current[hash];
    if (attachment) {
      loadedImages.current[hash] = true;
    }
  };

  const loadImages = useCallback(() => {
    if (!currentNote.current?.id) return;
    const timerId = "loading-images";
    clearTimeout(timers.current[timerId]);
    timers.current[timerId] = setTimeout(() => {
      if (!currentNote.current?.id) return;
      if (currentNote.current?.content?.isPreview) {
        db.content?.downloadMedia(
          currentNote.current?.id,
          currentNote.current.content,
          true
        );
      } else {
        const images = getImagesToLoad();
        if (images.length > 0) {
          db.attachments?.downloadMedia(currentNote.current?.id, images);
        }
      }
    }, 300);
  }, []);

  const loadNote = useCallback(
    async (
      item: Omit<NoteType, "type"> & {
        type: "note" | "new";
        forced?: boolean;
      }
    ) => {
      state.current.currentlyEditing = true;
      const editorState = useEditorStore.getState();

      if (item && item.type === "new") {
        currentNote.current && (await reset());
        const nextSessionId = makeSessionId(item as NoteType);
        setSessionId(nextSessionId);
        sessionIdRef.current = nextSessionId;
        sessionHistoryId.current = Date.now();
        await commands.setSessionId(nextSessionId);
        await commands.focus();
        lastContentChangeTime.current = 0;
        useEditorStore.getState().setReadonly(false);
      } else {
        if (!item.forced && currentNote.current?.id === item.id) return;
        isDefaultEditor && editorState.setCurrentlyEditingNote(item.id);
        overlay(true, item);
        attachedImages.current = [];
        currentNote.current && (await reset(false));
        await loadContent(item as NoteType);
        lastContentChangeTime.current = item.dateEdited;
        const nextSessionId = makeSessionId(item as NoteType);
        sessionHistoryId.current = Date.now();
        setSessionId(nextSessionId);
        sessionIdRef.current = nextSessionId;
        await commands.setSessionId(nextSessionId);
        currentNote.current = item as NoteType;
        await commands.setStatus(timeConverter(item.dateEdited), "Saved");
        await postMessage(EditorEvents.title, item.title);
        await postMessage(EditorEvents.html, currentContent.current?.data);
        useEditorStore.getState().setReadonly(item.readonly);
        await commands.setTags(currentNote.current);
        commands.setSettings();
        overlay(false);
        loadImages();
      }
    },
    [
      commands,
      isDefaultEditor,
      loadContent,
      loadImages,
      overlay,
      postMessage,
      reset
    ]
  );

  const lockNoteWithVault = useCallback((note: NoteType) => {
    eSendEvent(eClearEditor);
    openVault({
      item: note,
      novault: true,
      locked: true,
      goToEditor: true,
      title: "Open note",
      description: "Unlock note to open it in editor."
    });
  }, []);

  const onSyncComplete = useCallback(
    async (data: NoteType | Content) => {
      if (SettingsService.get().disableRealtimeSync) return;
      if (!data) return;
      const noteId = data.type === "tiptap" ? data.noteId : data.id;

      if (!currentNote.current || noteId !== currentNote.current.id) return;
      const isContentEncrypted = typeof (data as Content)?.data === "object";
      const note = db.notes?.note(currentNote.current?.id).data as NoteType;

      if (lastContentChangeTime.current >= (data as NoteType).dateEdited)
        return;

      lock.current = true;

      if (data.type === "tiptap") {
        if (!currentNote.current.locked && isContentEncrypted) {
          lockNoteWithVault(note);
        } else if (currentNote.current.locked && isContentEncrypted) {
          const decryptedContent = (await db.vault?.decryptContent(
            data
          )) as Content;
          if (!decryptedContent) {
            lockNoteWithVault(note);
          } else {
            await postMessage(EditorEvents.updatehtml, decryptedContent.data);
            currentContent.current = decryptedContent;
          }
        } else {
          const _nextContent = data.data;
          if (_nextContent === currentContent.current?.data) return;
          lastContentChangeTime.current = note.dateEdited;
          await postMessage(EditorEvents.updatehtml, _nextContent);
          currentContent.current = data;
        }
      } else {
        const note = data as NoteType;
        if (note.title !== currentNote.current.title) {
          postMessage(EditorEvents.title, note.title);
        }
        if (note.tags !== currentNote.current.tags) {
          await commands.setTags(note);
        }
        await commands.setStatus(timeConverter(note.dateEdited), "Saved");
      }
      lock.current = false;
      if (data.type === "tiptap") {
        loadImages();
        db.eventManager.subscribe(
          EVENTS.syncCompleted,
          () => {
            loadImages();
          },
          true
        );
      }
    },
    [loadImages, lockNoteWithVault, postMessage, commands]
  );

  useEffect(() => {
    const syncCompletedSubscription = db.eventManager?.subscribe(
      EVENTS.syncItemMerged,
      onSyncComplete
    );
    eSubscribeEvent(eOnLoadNote + editorId, loadNote);
    return () => {
      syncCompletedSubscription?.unsubscribe();
      eUnSubscribeEvent(eOnLoadNote + editorId, loadNote);
    };
  }, [editorId, loadNote, onSyncComplete]);

  const saveContent = useCallback(
    ({
      title,
      content,
      type
    }: {
      title?: string;
      content?: string;
      type: string;
    }) => {
      lastContentChangeTime.current = Date.now();
      if (lock.current) return;
      if (type === EditorEvents.content) {
        currentContent.current = {
          data: content,
          type: "tiptap",
          noteId: currentNote.current?.id as string
        };
      }
      const params = {
        title,
        data: content,
        type: "tiptap",
        sessionId,
        id: currentNote.current?.id,
        sessionHistoryId: sessionHistoryId.current
      };

      withTimer(
        currentNote.current?.id || "newnote",
        () => {
          if (
            currentNote.current &&
            !params.id &&
            params.sessionId === sessionId
          ) {
            params.id = currentNote.current?.id;
          }
          if (onChange && params.data) {
            onChange(params.data);
            return;
          }
          saveNote(params);
        },
        500
      );
    },
    [sessionId, withTimer, onChange, saveNote]
  );

  const restoreEditorState = useCallback(async () => {
    const appState = getAppState();
    if (!appState) return;
    overlay(true, appState.note);
    state.current.isRestoringState = true;
    state.current.currentlyEditing = true;
    state.current.movedAway = false;
    if (!DDS.isTab) {
      tabBarRef.current?.goToPage(1, false);
    }
    if (appState.note) {
      if (useNoteStore.getState().loading) {
        const remove = useNoteStore.subscribe((state) => {
          if (!state.loading && appState.note) {
            loadNote(appState.note);
            remove();
          }
        });
      } else {
        loadNote(appState.note);
      }
    }
    clearAppState();
    state.current.isRestoringState = false;
  }, [loadNote, overlay]);

  useEffect(() => {
    isDefaultEditor && restoreEditorState();
  }, [isDefaultEditor, restoreEditorState]);

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote + editorId, loadNote);
    return () => {
      eUnSubscribeEvent(eOnLoadNote + editorId, loadNote);
    };
  }, [editorId, loadNote, restoreEditorState, isDefaultEditor]);

  const onLoad = useCallback(async () => {
    state.current.ready = true;
    onReady();
    postMessage(EditorEvents.theme, theme || useThemeStore.getState().colors);
    commands.setInsets(
      isDefaultEditor ? insets : { top: 0, left: 0, right: 0, bottom: 0 }
    );
    if (currentNote.current) {
      loadNote({ ...currentNote.current, forced: true });
    } else {
      await commands.setPlaceholder(placeholderTip.current);
    }
    commands.setSettings();
  }, [
    onReady,
    postMessage,
    theme,
    commands,
    isDefaultEditor,
    insets,
    loadNote
  ]);

  const onContentChanged = () => {
    lastContentChangeTime.current = Date.now();
  };

  return {
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
    onReady,
    saveContent,
    onContentChanged,
    editorId: editorId,
    markImageLoaded
  };
};

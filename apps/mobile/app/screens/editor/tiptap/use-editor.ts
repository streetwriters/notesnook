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

import { getFormattedDate } from "@notesnook/common";
import {
  isEncryptedContent,
  isUnencryptedContent
} from "@notesnook/core/dist/collections/content";
import { NoteContent } from "@notesnook/core/dist/collections/session-content";
import { EVENTS } from "@notesnook/core/dist/common";
import {
  ContentItem,
  ContentType,
  Note,
  UnencryptedContentItem,
  isDeleted
} from "@notesnook/core/dist/types";
import { useThemeEngineStore } from "@notesnook/theme";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WebView from "react-native-webview";
import { DatabaseLogger, db } from "../../../common/database";
import useGlobalSafeAreaInsets from "../../../hooks/use-global-safe-area-insets";
import { DDS } from "../../../services/device-detection";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import Notifications from "../../../services/notifications";
import SettingsService from "../../../services/settings";
import { TipManager } from "../../../services/tip-manager";
import { useEditorStore } from "../../../stores/use-editor-store";
import { useNoteStore } from "../../../stores/use-notes-store";
import { useTagStore } from "../../../stores/use-tag-store";
import { eClearEditor, eOnLoadNote } from "../../../utils/events";
import { tabBarRef } from "../../../utils/global-refs";
import { onNoteCreated } from "../../notes/common";
import Commands from "./commands";
import { EditorState, SavePayload } from "./types";
import {
  EditorEvents,
  clearAppState,
  defaultState,
  getAppState,
  isContentInvalid,
  isEditorLoaded,
  makeSessionId,
  post
} from "./utils";

export const useEditor = (
  editorId = "",
  readonly?: boolean,
  onChange?: (html: string) => void
) => {
  const theme = useThemeEngineStore((state) => state.theme);

  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef(makeSessionId());
  const editorRef = useRef<WebView>(null);
  const currentNote = useRef<
    | (Note & {
        content?: NoteContent<false> & {
          isPreview?: boolean;
        };
      })
    | null
  >();
  const currentContent = useRef<Partial<UnencryptedContentItem> | null>();
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
  const lockedSessionId = useRef<string>();
  const loadingState = useRef<string>();

  const postMessage = useCallback(
    async <T>(type: string, data: T, waitFor = 300) =>
      await post(editorRef, sessionIdRef.current, type, data, waitFor),
    [sessionIdRef]
  );

  useEffect(() => {
    commands.setInsets(
      isDefaultEditor ? insets : { top: 0, left: 0, right: 0, bottom: 0 }
    );
  }, [commands, insets, isDefaultEditor]);

  useEffect(() => {
    postMessage(EditorEvents.theme, theme);
  }, [theme, postMessage]);

  useEffect(() => {
    commands.setTags(currentNote.current);
  }, [commands, tags]);

  const overlay = useCallback(
    (show: boolean, data = { type: "new" }) => {
      eSendEvent(
        "loadingNote" + editorId,
        show ? data || currentNote.current : false
      );
    },
    [editorId]
  );

  useEffect(() => {
    if (loading) {
      state.current.ready = false;
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
    async (resetState = true, resetContent = true) => {
      currentNote.current?.id && db.fs().cancel(currentNote.current.id);
      currentNote.current = null;
      currentContent.current = null;
      sessionHistoryId.current = undefined;
      saveCount.current = 0;
      loadingState.current = undefined;
      lock.current = false;
      useEditorStore.getState().setReadonly(false);
      resetContent && postMessage(EditorEvents.title, "");
      lastContentChangeTime.current = 0;
      resetContent && (await commands.clearContent());
      resetContent && (await commands.clearTags());

      if (resetState) {
        const newSessionId = makeSessionId();
        sessionIdRef.current = newSessionId;
        await commands.setSessionId(newSessionId);

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
      sessionHistoryId: currentSessionHistoryId,
      ignoreEdit
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
        let note = id ? db.notes?.note(id)?.data : undefined;
        const locked = note?.locked;
        if (note?.conflicted) return;

        if (isContentInvalid(data)) {
          // Create a new history session if recieved empty or invalid content
          // To ensure that history is preserved for correct content.
          sessionHistoryId.current = Date.now();
          currentSessionHistoryId = sessionHistoryId.current;
        }

        const noteData: Partial<Note> & {
          sessionId?: string;
          content?: NoteContent<false>;
        } = {
          id,
          sessionId: isContentInvalid(data)
            ? undefined
            : (currentSessionHistoryId as any)
        };

        noteData.title = title;

        if (ignoreEdit) {
          console.log("Ignoring edits...");
          noteData.dateEdited = note?.dateEdited;
        }

        if (data) {
          noteData.content = {
            data: data,
            type: type as ContentType
          };
        }
        if (!locked) {
          id = await db.notes?.add(noteData);
          if (!note && id) {
            currentNote.current = db.notes?.note(id)?.data;
            const defaultNotebook = db.settings.getDefaultNotebook();
            if (!state.current.onNoteCreated && defaultNotebook) {
              onNoteCreated(id, {
                type: defaultNotebook.topic ? "topic" : "notebook",
                id: defaultNotebook.id,
                notebook: defaultNotebook.topic
              });
            } else {
              state.current?.onNoteCreated && state.current.onNoteCreated(id);
            }

            if (!noteData.title) {
              postMessage(EditorEvents.title, currentNote.current?.title);
            }
          }

          if (
            useEditorStore.getState().currentEditingNote !== id &&
            isDefaultEditor &&
            state.current.currentlyEditing
          ) {
            setTimeout(() => {
              if (
                (currentNote.current?.id && currentNote.current?.id !== id) ||
                !state.current.currentlyEditing
              )
                return;
              id && useEditorStore.getState().setCurrentlyEditingNote(id);
            });
          }

          if (Notifications.isNotePinned(id as string)) {
            Notifications.pinNote(id as string);
          }
        } else {
          noteData.contentId = note?.contentId;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await db.vault?.save(noteData as any);
        }
        if (id && sessionIdRef.current === currentSessionId) {
          note = db.notes?.note(id)?.data as Note;
          await commands.setStatus(
            getFormattedDate(note.dateEdited, "date-time"),
            "Saved"
          );

          lastContentChangeTime.current = note.dateEdited;

          if (
            saveCount.current < 2 ||
            currentNote.current?.title !== note.title ||
            currentNote.current?.headline?.slice(0, 200) !==
              note.headline?.slice(0, 200)
          ) {
            Navigation.queueRoutesForUpdate();
          }
        }

        saveCount.current++;
        return id;
      } catch (e) {
        console.error(e);
        DatabaseLogger.error(e as Error);
      }
    },
    [commands, isDefaultEditor, postMessage, readonly, reset]
  );

  const loadContent = useCallback(
    async (
      note: Note & {
        content?: NoteContent<false>;
      }
    ) => {
      currentNote.current = note;
      if ((note.locked || note.content) && note.content?.data) {
        currentContent.current = {
          data: note.content?.data,
          type: note.content?.type || "tiptap",
          noteId: currentNote.current?.id as string
        };
      } else if (note.contentId) {
        const rawContent = await db.content?.raw(note.contentId);
        if (
          rawContent &&
          !isDeleted(rawContent) &&
          isUnencryptedContent(rawContent)
        ) {
          currentContent.current = {
            data: rawContent.data,
            type: rawContent.type
          };
        }
      }
    },
    []
  );

  const loadNote = useCallback(
    async (event: { item?: Note; forced?: boolean; newNote?: boolean }) => {
      state.current.currentlyEditing = true;
      const editorState = useEditorStore.getState();

      if (
        !state.current.ready &&
        (await isEditorLoaded(editorRef, sessionIdRef.current))
      ) {
        state.current.ready = true;
      }

      if (event.newNote) {
        currentNote.current && (await reset());
        const nextSessionId = makeSessionId(event.item?.id);
        sessionIdRef.current = nextSessionId;
        sessionHistoryId.current = Date.now();
        await commands.setSessionId(nextSessionId);
        if (state.current?.ready) await commands.focus();
        lastContentChangeTime.current = 0;
        useEditorStore.getState().setReadonly(false);
      } else {
        if (!event.item) return;
        const item = event.item;

        if (!event.forced && currentNote.current?.id === item.id) return;
        state.current.movedAway = false;
        state.current.currentlyEditing = true;

        if (currentNote.current?.id !== item.id) {
          currentNote.current && (await reset(false, false));
          isDefaultEditor && editorState.setCurrentlyEditingNote(item.id);
        }

        await loadContent(item);

        if (
          currentNote.current?.id === item.id &&
          loadingState.current &&
          currentContent.current?.data &&
          loadingState.current === currentContent.current?.data
        ) {
          return;
        }

        if (
          !currentContent.current?.data ||
          currentContent.current?.data.length < 50000
        ) {
          if (state.current.ready) overlay(false);
        } else {
          overlay(true);
        }
        if (!state.current.ready) {
          currentNote.current = item;
          return;
        }
        lastContentChangeTime.current = item.dateEdited;
        const nextSessionId = makeSessionId(item.id);
        sessionIdRef.current = nextSessionId;
        lockedSessionId.current = nextSessionId;
        sessionHistoryId.current = Date.now();
        await commands.setSessionId(nextSessionId);
        currentNote.current = item;
        await commands.setStatus(getFormattedDate(item.dateEdited), "Saved");
        await postMessage(EditorEvents.title, item.title);
        loadingState.current = currentContent.current?.data;

        await postMessage(
          EditorEvents.html,
          currentContent.current?.data || "",
          10000
        );

        loadingState.current = undefined;
        useEditorStore.getState().setReadonly(item.readonly);
        await commands.setTags(currentNote.current);
        commands.setSettings();
        setTimeout(() => {
          if (lockedSessionId.current === nextSessionId) {
            lockedSessionId.current = undefined;
          }
        }, 300);
        overlay(false);
      }
    },
    [commands, isDefaultEditor, loadContent, overlay, postMessage, reset]
  );

  const lockNoteWithVault = useCallback((note: Note) => {
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
    async (data: Note | ContentItem) => {
      if (SettingsService.get().disableRealtimeSync) return;
      if (!data) return;
      const noteId = data.type === "tiptap" ? data.noteId : data.id;

      if (!currentNote.current || noteId !== currentNote.current.id) return;
      const isContentEncrypted =
        typeof (data as ContentItem)?.data === "object";

      const note = db.notes?.note(currentNote.current?.id)?.data;

      if (lastContentChangeTime.current >= (data as Note).dateEdited) return;

      lock.current = true;

      if (data.type === "tiptap" && note) {
        if (!currentNote.current.locked && isContentEncrypted) {
          lockNoteWithVault(note);
        } else if (currentNote.current.locked && isEncryptedContent(data)) {
          const decryptedContent = await db.vault?.decryptContent(data);
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
          if (!isEncryptedContent(data)) {
            currentContent.current = data as UnencryptedContentItem;
          }
        }
      } else {
        if (data.type !== "note") return;
        const note = data;
        if (note.title !== currentNote.current.title) {
          postMessage(EditorEvents.title, note.title);
        }
        if (note.tags !== currentNote.current.tags) {
          await commands.setTags(note);
        }
        await commands.setStatus(
          getFormattedDate(note.dateEdited, "date-time"),
          "Saved"
        );
      }

      lock.current = false;
    },
    [lockNoteWithVault, postMessage, commands]
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
      type,
      forSessionId,
      ignoreEdit
    }: {
      title?: string;
      content?: string;
      type: string;
      forSessionId: string;
      ignoreEdit: boolean;
    }) => {
      if (lock.current || lockedSessionId.current === forSessionId) return;
      lastContentChangeTime.current = Date.now();

      if (
        sessionHistoryId.current &&
        Date.now() - sessionHistoryId.current > 5 * 60 * 1000
      ) {
        sessionHistoryId.current = Date.now();
      }

      if (type === EditorEvents.content) {
        currentContent.current = {
          data: content,
          type: "tiptap",
          noteId: currentNote.current?.id as string
        };
      }
      const noteIdFromSessionId =
        !forSessionId || forSessionId.startsWith("session")
          ? null
          : forSessionId.split("_")[0];

      const noteId = noteIdFromSessionId || currentNote.current?.id;
      const params: SavePayload = {
        title,
        data: content,
        type: "tiptap",
        sessionId: forSessionId,
        id: noteId,
        sessionHistoryId: sessionHistoryId.current,
        ignoreEdit
      };
      withTimer(
        noteId || "newnote",
        () => {
          if (
            currentNote.current &&
            !params.id &&
            params.sessionId === forSessionId
          ) {
            params.id = currentNote.current?.id;
          }
          if (onChange && params.data) {
            onChange(params.data);
            return;
          }
          saveNote(params);
        },
        ignoreEdit ? 0 : 150
      );
    },
    [withTimer, onChange, saveNote]
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
            loadNote({
              item: appState.note
            });
            remove();
          }
        });
      } else {
        loadNote({
          item: appState.note
        });
      }
    }
    clearAppState();
    state.current.isRestoringState = false;
  }, [loadNote, overlay]);

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote + editorId, loadNote);
    return () => {
      eUnSubscribeEvent(eOnLoadNote + editorId, loadNote);
    };
  }, [editorId, loadNote, restoreEditorState, isDefaultEditor]);

  const onContentChanged = () => {
    lastContentChangeTime.current = Date.now();
  };

  useEffect(() => {
    state.current.saveCount = 0;
  }, [loading]);

  const onReady = useCallback(async () => {
    if (!(await isEditorLoaded(editorRef, sessionIdRef.current))) {
      eSendEvent("webview_reset", "onReady");
      return false;
    } else {
      isDefaultEditor && restoreEditorState();
      return true;
    }
  }, [isDefaultEditor, restoreEditorState]);

  const onLoad = useCallback(async () => {
    if (currentNote.current) overlay(true);
    clearTimeout(timers.current["editor:loaded"]);
    timers.current["editor:loaded"] = setTimeout(async () => {
      postMessage(EditorEvents.theme, theme);
      commands.setInsets(
        isDefaultEditor ? insets : { top: 0, left: 0, right: 0, bottom: 0 }
      );
      await commands.setSessionId(sessionIdRef.current);
      await commands.setSettings();
      timers.current["editor:loaded"] = setTimeout(async () => {
        if (!state.current.ready && (await onReady())) {
          state.current.ready = true;
        }
        if (currentNote.current) {
          loadNote({ ...currentNote.current, forced: true });
        } else {
          await commands.setPlaceholder(placeholderTip.current);
        }
      });
    });
  }, [
    onReady,
    postMessage,
    theme,
    commands,
    isDefaultEditor,
    insets,
    loadNote,
    overlay
  ]);

  return {
    ref: editorRef,
    onLoad,
    commands,
    reset,
    loading,
    setLoading,
    state,
    sessionId: sessionIdRef,
    note: currentNote,
    onReady,
    saveContent,
    onContentChanged,
    editorId: editorId,
    overlay,
    postMessage
  };
};

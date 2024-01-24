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
import { isEncryptedContent } from "@notesnook/core/dist/collections/content";
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
import { useSettingStore } from "../../../stores/use-setting-store";
import { useTagStore } from "../../../stores/use-tag-store";
import {
  eClearEditor,
  eEditorTabFocused,
  eOnLoadNote
} from "../../../utils/events";
import { tabBarRef } from "../../../utils/global-refs";
import { onNoteCreated } from "../../notes/common";
import Commands from "./commands";
import { SessionHistory } from "./session-history";
import { EditorState, SavePayload } from "./types";
import { syncTabs, useTabStore } from "./use-tab-store";
import {
  EditorEvents,
  clearAppState,
  defaultState,
  getAppState,
  isContentInvalid,
  isEditorLoaded,
  post
} from "./utils";

// Keep a fixed session id, dont' change it when a new note is opened, session id can stay the same always I think once the app is opened. DONE
// Editor will save any note content & title is recieved. and dispatch update to relavant tab always.

// Editor keeps track of what tab is opened and which note is currently focused by keeping a synced zustand store with editor. DONE
// the useEditor hook can recieve save messages for different notes at a time. DONE
// When a note is created, the useEditor hook must immediately notify the editor with the note id and set the note id in the editor tabs store
// so further changes will go into that note. DONE
// Events sent to editor have the tab id value added to ensure the correct tab will recieve and return events only. DONE
// The useEditorEvents hook can manage events from different tabs at the same time as long as the attached session id matches. DONE
// useEditor hook will keep historySessionId for different notes instead of a single note. DONE
//
// LIST OF CASES TO VERIFY WITH TABS OPENING & CLOSING
// 1. SWITCHING TAB CLOSES THE SHEET. DONE
// 2. Closing the tab does proper cleanup if it's the last tab and is not empty. DONE
// 3. Swiping left only focuses editor if current tab is empty. DONE
// 4. Pressing + button will open a new tab for new note if an empty tab does not exist.
// 5. Notes will always open in the preview tab.
// 6. If a note is edited, the tab will become persisted.
// 7. If note is already opened in a tab, we focus that tab.
// 8. If app is killed, restore the note in  background.
// 9. During realtimes sync, tabs not focused will be updated so if focused, they have the latest and updated content loaded.

type NoteWithContent = Note & {
  content?: NoteContent<false>;
};

export const useEditor = (
  editorId = "",
  readonly?: boolean,
  onChange?: (html: string) => void
) => {
  const theme = useThemeEngineStore((state) => state.theme);
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef("notesnook-editor");
  const editorRef = useRef<WebView>(null);

  const currentNotes = useRef<
    Record<
      string,
      | (Note & {
          content?: NoteContent<false> & {
            isPreview?: boolean;
          };
        })
      | null
      | undefined
    >
  >({});

  const currentContents = useRef<
    Record<string, Partial<UnencryptedContentItem> | null>
  >({});

  const timers = useRef<{ [name: string]: NodeJS.Timeout }>({});
  const commands = useMemo(() => new Commands(editorRef), [editorRef]);
  const editorSessionHistory = useMemo(() => new SessionHistory(), []);
  const state = useRef<Partial<EditorState>>(defaultState);
  const tags = useTagStore((state) => state.items);
  const insets = useGlobalSafeAreaInsets();
  const isDefaultEditor = editorId === "";
  const saveCount = useRef(0);
  const lastContentChangeTime = useRef<Record<string, number>>({});
  const lock = useRef(false);
  const loadedImages = useRef<Record<string, { [name: string]: boolean }>>({});
  const currentLoadingNoteId = useRef<string>();
  const loadingState = useRef<string>();
  const lastTabFocused = useRef(0);
  const blockIdRef = useRef<string>();
  const postMessage = useCallback(
    async <T>(type: string, data: T, tabId?: number, waitFor = 300) =>
      await post(
        editorRef,
        sessionIdRef.current,
        typeof tabId !== "number" ? useTabStore.getState().currentTab : tabId,
        type,
        data,
        waitFor
      ),
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
    for (const id in currentNotes.current) {
      commands.setTags(currentNotes.current[id]);
    }
  }, [commands, tags]);

  useEffect(() => {
    const event = eSubscribeEvent(eEditorTabFocused, (tabId) => {
      lastTabFocused.current = tabId as number;
      console.log(tabId);
    });
    return () => {
      event.unsubscribe();
    };
  });

  const overlay = useCallback(
    (show: boolean, data = { type: "new" }) => {
      eSendEvent(
        "loadingNote" + editorId,
        show ? data || currentNotes.current : false
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
    async (tabId: number, resetState = true, resetContent = true) => {
      console.log("Resetting tab:", tabId);
      const noteId = useTabStore.getState().getNoteIdForTab(tabId);
      if (noteId) {
        currentNotes.current?.id && db.fs().cancel(noteId, "download");
        currentNotes.current[noteId] = null;
        loadedImages.current[noteId] = {};
        currentContents.current[noteId] = null;
        editorSessionHistory.clearSession(noteId);
        lastContentChangeTime.current[noteId] = 0;
        clearTimeout(timers.current["loading-images" + noteId]);
      }

      saveCount.current = 0;
      loadingState.current = undefined;
      lock.current = false;
      resetContent && postMessage(EditorEvents.title, "", tabId);

      resetContent && (await commands.clearContent(tabId));
      resetContent && (await commands.clearTags(tabId));
      useTabStore.getState().updateTab(tabId, {
        noteId: undefined,
        locked: false
      });
    },
    [commands, editorSessionHistory, postMessage]
  );

  const saveNote = useCallback(
    async ({
      title,
      id,
      data,
      type,
      sessionHistoryId: currentSessionHistoryId,
      tabId
    }: SavePayload) => {
      if (currentNotes.current[id as string]?.readonly || readonly) return;
      try {
        if (id && !(await db.notes?.note(id))) {
          await reset(tabId);
          return;
        }
        let note = id ? await db.notes?.note(id) : undefined;
        const locked = note?.locked;
        if (note?.conflicted) return;

        if (isContentInvalid(data) && id) {
          // Create a new history session if recieved empty or invalid content
          // To ensure that history is preserved for correct content.
          currentSessionHistoryId = editorSessionHistory.newSession(id);
        }

        const noteData: Partial<Note> & {
          sessionId?: string;
          content?: NoteContent<false>;
        } = {
          id,
          sessionId: `${currentSessionHistoryId}`
        };

        noteData.title = title;
        if (data) {
          noteData.content = {
            data: data,
            type: type as ContentType
          };
        }

        // If note is edited, the tab becomes a persistent tab automatically.
        if (useTabStore.getState().getTab(tabId)?.previewTab) {
          useTabStore.getState().updateTab(tabId, {
            previewTab: false
          });
        }

        if (!locked) {
          id = await db.notes?.add({ ...noteData });
          if (!note && id) {
            editorSessionHistory.newSession(id);
            if (id) {
              currentNotes.current[id] = await db.notes?.note(id);
            }

            useTabStore.getState().updateTab(tabId, {
              noteId: id
            });

            const defaultNotebook = db.settings.getDefaultNotebook();
            if (!state.current.onNoteCreated && defaultNotebook) {
              onNoteCreated(id, {
                type: "notebook",
                id: defaultNotebook
              });
            } else {
              state.current?.onNoteCreated && state.current.onNoteCreated(id);
            }

            if (!noteData.title) {
              postMessage(
                EditorEvents.title,
                currentNotes.current[id]?.title,
                tabId
              );
            }
          }

          if (Notifications.isNotePinned(id as string)) {
            Notifications.pinNote(id as string);
          }
        } else {
          noteData.contentId = note?.contentId;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await db.vault?.save(noteData as any);
        }

        if (id && useTabStore.getState().getTabForNote(id) === tabId) {
          note = (await db.notes?.note(id)) as Note;
          await commands.setStatus(
            getFormattedDate(note.dateEdited, "date-time"),
            "Saved",
            tabId
          );

          lastContentChangeTime.current[id] = note.dateEdited;

          if (
            saveCount.current < 2 ||
            currentNotes.current[id]?.title !== note.title ||
            currentNotes.current[id]?.headline?.slice(0, 200) !==
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
    [commands, editorSessionHistory, postMessage, readonly, reset]
  );

  const loadContent = useCallback(
    async (
      note: Note & {
        content?: NoteContent<false>;
      }
    ) => {
      currentNotes.current[note.id] = note;

      if ((note.locked || note.content) && note.content?.data) {
        currentContents.current[note.id] = {
          data: note.content?.data,
          type: note.content?.type || "tiptap",
          noteId: note.id
        };
      } else if (note.contentId) {
        const rawContent = await db.content?.get(note.contentId);
        if (rawContent && !isDeleted(rawContent) && !rawContent.locked) {
          currentContents.current[note.id] = {
            data: rawContent.data,
            type: rawContent.type
          };
        }
      }
    },
    []
  );

  const getMediaToLoad = (noteId: string, previousContent?: string) => {
    if (!currentNotes.current?.id) return [];

    const previousAttachments =
      previousContent?.matchAll(/data-hash="(.+?)"/gm) || [];
    const attachments =
      currentContents.current[noteId]?.data?.matchAll(/data-hash="(.+?)"/gm) ||
      [];

    const media: string[] = [];

    const oldMatches = Array.from(previousAttachments).map((match) => match[1]);
    const matches = Array.from(attachments).map((match) => match[1]);

    for (let i = 0; i < matches.length; i++) {
      const currentHash = matches[i];
      const oldHash = oldMatches[i];
      if (currentHash !== oldHash) {
        media.push(currentHash);
        if (!loadedImages.current[noteId]) loadedImages.current[noteId] = {};
        loadedImages.current[noteId][currentHash] = false;
      }
    }
    return media;
  };

  const markImageLoaded = (groupId: string, hash: string) => {
    const attachment = loadedImages.current[groupId]?.[hash];
    if (typeof attachment === "boolean") {
      loadedImages.current[groupId][hash] = true;
    }
  };

  const loadImages = useCallback((noteId: string, previousContent?: string) => {
    if (!currentNotes.current?.id) return;
    const timerId = "loading-images" + noteId;
    clearTimeout(timers.current[timerId]);
    timers.current[timerId] = setTimeout(() => {
      if (!currentNotes.current?.id) return;

      if (currentNotes.current[noteId]?.content?.isPreview) {
        db.content?.downloadMedia(
          noteId,
          currentNotes.current[noteId]?.content as NoteContent<false>,
          true
        );
      } else {
        const media = getMediaToLoad(noteId, previousContent);
        if (media.length > 0) {
          db.attachments?.downloadMedia(noteId, media);
        }
      }
    }, 1000);
  }, []);

  const loadNote = useCallback(
    async (event: {
      item?: Note;
      forced?: boolean;
      newNote?: boolean;
      tabId?: number;
      blockId?: string;
    }) => {
      blockIdRef.current = event.blockId;
      state.current.currentlyEditing = true;
      if (
        !state.current.ready &&
        (await isEditorLoaded(
          editorRef,
          sessionIdRef.current,
          useTabStore.getState().currentTab
        ))
      ) {
        state.current.ready = true;
      }

      if (event.newNote) {
        useTabStore.getState().focusEmptyTab();
        const tabId = useTabStore.getState().currentTab;
        currentNotes.current && (await reset(tabId));
        setTimeout(() => {
          if (state.current?.ready) commands.focus(tabId);
        });
      } else {
        if (!event.item) return;
        const item = event.item;
        const noteIsLocked =
          event.item.locked && !(event.item as NoteWithContent).content;

        // If note was already opened in a tab, focus that tab.
        if (typeof event.tabId !== "number") {
          if (useTabStore.getState().hasTabForNote(event.item.id)) {
            const tabId = useTabStore.getState().getTabForNote(event.item.id);
            if (typeof tabId === "number") {
              useTabStore.getState().updateTab(tabId, {
                readonly: event.item.readonly || readonly,
                locked: noteIsLocked
              });
              useTabStore.getState().focusTab(tabId);
            }
            console.log("Note already loaded, focusing the tab");
          } else {
            console.log("Opening note in preview tab");
            // Otherwise we focus the preview tab or create one to open the note in.
            useTabStore.getState().focusPreviewTab(event.item.id, {
              readonly: event.item.readonly || readonly,
              locked:
                event.item.locked && !(event.item as NoteWithContent).content
            });
          }
        } else {
          if (lastTabFocused.current !== event.tabId) {
            useTabStore.getState().focusTab(event.tabId);
          }
        }

        const tabId = event.tabId || useTabStore.getState().currentTab;
        if (lastTabFocused.current !== tabId) {
          // if ((await waitForEvent(eEditorTabFocused, 1000)) !== tabId) {
          //   console.log("tab id did not match after focus in 1000ms");
          //   return;
          // }
          console.log("Waiting for tab to focus");
          return;
        }

        state.current.movedAway = false;
        state.current.currentlyEditing = true;

        if (!noteIsLocked) {
          await loadContent(item);
        }

        if (
          currentNotes.current[item.id] &&
          loadingState.current &&
          currentContents.current[item.id]?.data &&
          loadingState.current === currentContents.current[item.id]?.data
        ) {
          // If note is already loading, return.
          return;
        }

        if (!state.current.ready) {
          currentNotes.current[item.id] = item;
          return;
        }

        lastContentChangeTime.current[item.id] = item.dateEdited;
        currentLoadingNoteId.current = item.id;
        currentNotes.current[item.id] = item;

        if (!currentNotes.current[item.id]) return;

        editorSessionHistory.newSession(item.id);

        await commands.setStatus(
          getFormattedDate(item.dateEdited, "date-time"),
          "Saved",
          tabId
        );

        await postMessage(EditorEvents.title, item.title, tabId);
        overlay(false);
        loadingState.current = currentContents.current[item.id]?.data;

        await postMessage(
          EditorEvents.html,
          currentContents.current[item.id]?.data || "",
          tabId,
          10000
        );

        setTimeout(() => {
          if (blockIdRef.current) {
            commands.scrollIntoViewById(blockIdRef.current);
            blockIdRef.current = undefined;
          }
        }, 300);

        loadingState.current = undefined;
        await commands.setTags(item);
        commands.setSettings();
        setTimeout(() => {
          if (currentLoadingNoteId.current === event.item?.id) {
            currentLoadingNoteId.current = undefined;
          }
        }, 300);
        loadImages(item.id);
      }
    },
    [
      commands,
      editorSessionHistory,
      loadContent,
      loadImages,
      postMessage,
      readonly,
      reset
    ]
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

      if (!useTabStore.getState().hasTabForNote(noteId)) return;

      const tabId = useTabStore.getState().getTabForNote(noteId);
      const isContentEncrypted =
        typeof (data as ContentItem)?.data === "object";

      const note = await db.notes?.note(noteId);

      if (lastContentChangeTime.current[noteId] >= (data as Note).dateEdited)
        return;

      lock.current = true;

      const previousContent = currentContents.current[noteId]?.data || "";

      if (data.type === "tiptap" && note) {
        // Handle this case where note was locked on another device and synced.
        if (!currentNotes.current[note.id]?.locked && isContentEncrypted) {
          lockNoteWithVault(note);
        } else if (note.locked && isEncryptedContent(data)) {
          const decryptedContent = await db.vault?.decryptContent(data, noteId);
          if (!decryptedContent) {
            lockNoteWithVault(note);
          } else {
            await postMessage(
              EditorEvents.updatehtml,
              decryptedContent.data,
              tabId
            );
            currentContents.current[note.id] = decryptedContent;
          }
        } else {
          const _nextContent = data.data;
          if (_nextContent === currentContents.current?.data) return;
          lastContentChangeTime.current[note.id] = note.dateEdited;
          await postMessage(EditorEvents.updatehtml, _nextContent, tabId);
          if (!isEncryptedContent(data)) {
            currentContents.current[note.id] = data as UnencryptedContentItem;
          }
        }
      } else {
        if (!note) return;
        postMessage(EditorEvents.title, note.title, tabId);
        commands.setTags(note);
        commands.setStatus(
          getFormattedDate(note.dateEdited, "date-time"),
          "Saved",
          tabId as number
        );
      }

      lock.current = false;
      if (data.type === "tiptap") {
        loadImages(noteId, previousContent);
        db.eventManager.subscribe(
          EVENTS.syncCompleted,
          () => {
            loadImages(noteId, previousContent);
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
      type,
      noteId,
      tabId
    }: {
      noteId?: string;
      title?: string;
      content?: string;
      type: string;
      tabId: number;
    }) => {
      if (
        lock.current ||
        (currentLoadingNoteId.current &&
          currentLoadingNoteId.current === noteId)
      )
        return;

      if (noteId) {
        lastContentChangeTime.current[noteId] = Date.now();
      }

      if (type === EditorEvents.content && noteId) {
        currentContents.current[noteId as string] = {
          data: content,
          type: "tiptap",
          noteId: noteId as string
        };
      }

      const params: SavePayload = {
        title,
        data: content,
        type: "tiptap",
        id: noteId,
        sessionHistoryId: noteId ? editorSessionHistory.get(noteId) : undefined,
        tabId: tabId
      };
      withTimer(
        noteId || "newnote",
        () => {
          if (!params.id) {
            params.id = useTabStore.getState().getNoteIdForTab(tabId);
          }
          if (onChange && params.data) {
            onChange(params.data);
            return;
          }
          saveNote(params);
        },
        150
      );
    },
    [editorSessionHistory, withTimer, onChange, saveNote]
  );

  const restoreEditorState = useCallback(async () => {
    const appState = getAppState();
    console.log(appState, "appState");
    if (!appState) return;
    state.current.isRestoringState = true;
    state.current.currentlyEditing = true;
    state.current.movedAway = false;

    if (!DDS.isTab) {
      tabBarRef.current?.goToPage(1, false);
    }
    clearAppState();
    state.current.isRestoringState = false;
  }, []);

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote + editorId, loadNote);
    return () => {
      eUnSubscribeEvent(eOnLoadNote + editorId, loadNote);
    };
  }, [editorId, loadNote, restoreEditorState, isDefaultEditor]);

  const onContentChanged = (noteId?: string) => {
    if (noteId) {
      lastContentChangeTime.current[noteId] = Date.now();
    }
  };

  const onReady = useCallback(async () => {
    if (
      !(await isEditorLoaded(
        editorRef,
        sessionIdRef.current,
        useTabStore.getState().currentTab
      ))
    ) {
      eSendEvent("webview_reset", "onReady");
      return false;
    } else {
      syncTabs();
      isDefaultEditor && restoreEditorState();
      return true;
    }
  }, [isDefaultEditor, restoreEditorState]);

  const onLoad = useCallback(async () => {
    if (currentNotes.current) overlay(true);
    postMessage(EditorEvents.theme, theme);
    commands.setInsets(
      isDefaultEditor ? insets : { top: 0, left: 0, right: 0, bottom: 0 }
    );
    await commands.setSettings();

    if (!state.current.ready && (await onReady())) {
      state.current.ready = true;
    }

    const noteId = useTabStore.getState().getCurrentNoteId();
    if (!noteId) {
      overlay(false);
      loadNote({ newNote: true });
      if (tabBarRef.current?.page === 1) {
        state.current.currentlyEditing = false;
      }
    }
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
    note: currentNotes,
    onReady,
    saveContent,
    onContentChanged,
    editorId: editorId,
    markImageLoaded,
    overlay,
    postMessage
  };
};

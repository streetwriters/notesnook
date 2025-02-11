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
  ContentItem,
  ContentType,
  DeletedItem,
  EVENTS,
  ItemReference,
  Note,
  NoteContent,
  TrashItem,
  UnencryptedContentItem,
  isDeleted,
  isEncryptedContent,
  isTrashItem
} from "@notesnook/core";
import { EditorEvents } from "@notesnook/editor-mobile/src/utils/editor-events";
import { NativeEvents } from "@notesnook/editor-mobile/src/utils/native-events";
import { strings } from "@notesnook/intl";
import { useThemeEngineStore } from "@notesnook/theme";
import { Mutex } from "async-mutex";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WebView from "react-native-webview";
import { DatabaseLogger, db } from "../../../common/database";
import useGlobalSafeAreaInsets from "../../../hooks/use-global-safe-area-insets";
import { DDS } from "../../../services/device-detection";
import {
  ToastManager,
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { NotePreviewWidget } from "../../../services/note-preview-widget";
import Notifications from "../../../services/notifications";
import SettingsService from "../../../services/settings";
import { useSettingStore } from "../../../stores/use-setting-store";
import { useTagStore } from "../../../stores/use-tag-store";
import {
  eEditorReset,
  eEditorTabFocused,
  eOnLoadNote,
  eShowMergeDialog,
  eUpdateNoteInEditor
} from "../../../utils/events";
import { tabBarRef } from "../../../utils/global-refs";
import { sleep } from "../../../utils/time";
import { unlockVault } from "../../../utils/unlock-vault";
import { onNoteCreated } from "../../notes/common";
import Commands from "./commands";
import { SessionHistory } from "./session-history";
import { EditorState, SavePayload } from "./types";
import { TabSessionItem, syncTabs, useTabStore } from "./use-tab-store";
import {
  clearAppState,
  defaultState,
  getAppState,
  isContentInvalid,
  isEditorLoaded,
  post
} from "./utils";
import { Linking } from "react-native";

const loadNoteMutex = new Mutex();

type NoteWithContent = Note & {
  content?: NoteContent<false>;
};

type LocalTabStateT = {
  editedAt: number;
  lastFocusedAt: number;
};

class LocalTabState {
  state: Record<string, LocalTabStateT> = {};
  noteEditedTime: Record<string, number> = {};

  setEditTime(noteId: string, time: number) {
    this.noteEditedTime[noteId] = time;
  }

  get(tabId: string) {
    return this.state[tabId] || {};
  }

  set(tabId: string, state: Partial<LocalTabStateT>) {
    this.state[tabId] = {
      ...this.state[tabId],
      ...state
    };
  }

  clear(tabId: string) {
    delete this.state[tabId];
  }

  reset() {
    this.state = {};
  }

  needsRefresh(tabId: string, locked: boolean, readonly: boolean) {
    const state = this.get(tabId);
    const tabSession = useTabStore.getState().getTab(tabId)?.session;
    const noteId = useTabStore.getState().getNoteIdForTab(tabId);

    if (
      tabSession?.locked !== locked ||
      tabSession?.readonly !== readonly ||
      !noteId
    ) {
      console.log("tab is refreshing...");
      return true;
    }
    console.log(
      "Tab refreshing...",
      state.editedAt < this.noteEditedTime[noteId]
    );

    console.log(state.editedAt, this.noteEditedTime[noteId]);

    return !state.editedAt || state.editedAt < this.noteEditedTime[noteId];
  }
}

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
  const currentLoadingNoteId = useRef<string>();
  const lastTabFocused = useRef<string>();

  const localTabState = useRef<LocalTabState>(new LocalTabState());

  const blockIdRef = useRef<string>();
  const postMessage = useCallback(
    async <T>(type: string, data: T, tabId?: string, waitFor = 300) =>
      await post(
        editorRef,
        sessionIdRef.current,
        tabId || useTabStore.getState().currentTab!,
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
    postMessage(NativeEvents.theme, theme);
  }, [theme, postMessage]);

  useEffect(() => {
    for (const id in currentNotes.current) {
      commands.setTags(currentNotes.current[id]);
    }
  }, [commands, tags]);

  useEffect(() => {
    const event = eSubscribeEvent(eEditorTabFocused, (tabId: string) => {
      if (lastTabFocused.current !== tabId) lock.current = false;
      lastTabFocused.current = tabId;
    });
    return () => {
      event?.unsubscribe();
    };
  }, []);

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
      overlay(true);
      state.current.ready = false;
      setLoading(false);
    }
  }, [loading, overlay]);

  const withTimer = useCallback(
    (id: string, fn: () => void, duration: number) => {
      clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(fn, duration);
    },
    []
  );

  const reset = useCallback(
    async (tabId: string, resetState = true, resetContent = true) => {
      const noteId = useTabStore.getState().getNoteIdForTab(tabId);
      if (noteId) {
        currentNotes.current?.id && db.fs().cancel(noteId);
        currentNotes.current[noteId] = undefined;
        currentContents.current[noteId] = null;
        editorSessionHistory.clearSession(noteId);
        lastContentChangeTime.current[noteId] = 0;
        clearTimeout(timers.current["loading-images" + noteId]);
      }

      saveCount.current = 0;
      currentLoadingNoteId.current = undefined;
      lock.current = false;
      resetContent && postMessage(NativeEvents.title, "", tabId);
      resetContent && (await commands.clearContent(tabId));
      resetContent && (await commands.clearTags(tabId));
    },
    [commands, editorSessionHistory, postMessage]
  );

  const saveNote = useCallback(
    async ({
      title,
      id,
      data,
      type,
      ignoreEdit,
      sessionHistoryId: currentSessionHistoryId,
      tabId,
      pendingChanges
    }: SavePayload) => {
      if (currentNotes.current[id as string]?.readonly || readonly) return;
      try {
        if (id && !(await db.notes?.note(id))) {
          await reset(tabId);
          useTabStore.getState().updateTab(tabId, {
            session: {
              noteId: undefined,
              noteLocked: undefined,
              locked: undefined,
              readonly: undefined,
              scrollTop: undefined,
              selection: undefined
            }
          });
          return;
        }
        let note = id ? await db.notes?.note(id) : undefined;
        const locked = note && (await db.vaults.itemExists(note));

        if (note?.conflicted) {
          eSendEvent(eShowMergeDialog, note);
          return;
        }

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

        if (ignoreEdit) {
          DatabaseLogger.log("Ignoring edits...");
          noteData.dateEdited = note?.dateEdited;
        }

        if (data) {
          noteData.content = {
            data: data,
            type: type as ContentType
          };
        }

        let saved = false;
        setTimeout(() => {
          if (saved) return;
          commands.setStatus(
            getFormattedDate(note ? note.dateEdited : Date.now(), "date-time"),
            strings.saving(),
            tabId
          );
        }, 50);

        const saveTimer = setTimeout(() => {
          DatabaseLogger.log(`Note save timeout: ${id}...`);
          ToastManager.show({
            message: strings.savingNoteTakingTooLong(),
            type: "error",
            duration: 10000
          });
        }, 30 * 1000);

        if (!locked) {
          DatabaseLogger.log(`Saving note: ${id}...`);
          id = await db.notes?.add({ ...noteData });
          saved = true;
          DatabaseLogger.log(`Note saved: ${id}...`);

          clearTimeout(saveTimer);

          if (!note && id) {
            editorSessionHistory.newSession(id);
            if (id) {
              currentNotes.current[id] = await db.notes?.note(id);
            }

            useTabStore.getState().updateTab(tabId, {
              session: {
                noteId: id
              }
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
                NativeEvents.title,
                currentNotes.current[id]?.title,
                tabId
              );
            }
          }

          if (Notifications.isNotePinned(id as string)) {
            Notifications.pinNote(id as string);
          }
        } else {
          if (!db.vault.unlocked) {
            if (pendingChanges) await sleep(3000);
            const unlocked = await unlockVault({
              title: strings.unlockNote(),
              paragraph: strings.noteLockedSave(),
              context: "global"
            });
            if (!unlocked) throw new Error(strings.saveFailedVaultLocked());
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (typeof noteData.title === "string") {
            await db.notes.add({
              title: noteData.title,
              id: noteData.id
            });
          }

          noteData.contentId = note?.contentId;
          if (data) {
            await db.vault?.save(noteData as any);
          }
          clearTimeout(saveTimer);
        }

        if (id && useTabStore.getState().getTabForNote(id) === tabId) {
          note = (await db.notes?.note(id)) as Note;
          await commands.setStatus(
            getFormattedDate(note.dateEdited, "date-time"),
            strings.saved(),
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

        if (
          id &&
          id === useTabStore.getState().getCurrentNoteId() &&
          pendingChanges
        ) {
          postMessage(NativeEvents.title, title || note?.title, tabId);
          postMessage(NativeEvents.html, data, tabId);
          currentNotes.current[id] = note;
        }

        saveCount.current++;

        clearTimeout(timers.current.onsave);
        timers.current.onsave = setTimeout(async () => {
          if (!id || !note) return;
          NotePreviewWidget.updateNote(id, note);
        }, 500);

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
      const locked = note && (await db.vaults.itemExists(note));
      if ((locked || note.content) && note.content?.data) {
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

  const loadNote = useCallback(
    (event: {
      item?: Note;
      newNote?: boolean;
      tabId?: string;
      blockId?: string;
      session?: TabSessionItem;
      newTab?: boolean;
      refresh?: boolean;
    }) => {
      loadNoteMutex.runExclusive(async () => {
        if (!event) return;
        if (event.blockId) {
          blockIdRef.current = event.blockId;
        }
        state.current.currentlyEditing = true;

        if (
          !state.current.ready &&
          (await isEditorLoaded(
            editorRef,
            sessionIdRef.current,
            useTabStore.getState().currentTab!
          ))
        ) {
          state.current.ready = true;
        }
        if (event.newNote && !currentLoadingNoteId.current) {
          let tabId;
          if (useTabStore.getState().tabs.length === 0) {
            tabId = useTabStore.getState().newTab();
          } else {
            tabId = useTabStore.getState().currentTab;
            await reset(tabId!, true, true);
            if (
              event.session?.noteId ||
              useTabStore.getState().getTab(tabId!)?.session?.noteId
            ) {
              useTabStore.getState().newTabSession(tabId!, {});
            }
          }

          setTimeout(() => {
            if (state.current?.ready && !state.current.movedAway)
              commands.focus(tabId!);
          });
        } else {
          if (!event.item) {
            overlay(false);
            return;
          }

          const item = event.item;

          // If note is already open in a tab, focus that tab.
          if (useTabStore.getState().hasTabForNote(item.id) && !event.newTab) {
            const tabId = useTabStore.getState().getTabForNote(item.id);

            const currentTab = useTabStore
              .getState()
              .getTab(useTabStore.getState().currentTab as string);

            if (
              currentTab?.session?.noteId !== item.id &&
              tabId !== useTabStore.getState().currentTab
            ) {
              useTabStore.getState().focusTab(tabId as string);
              return;
            }
          }

          const isLockedNote = await db.vaults.itemExists(
            event.item as ItemReference
          );

          const tabLocked =
            isLockedNote && !(event.item as NoteWithContent).content;

          const tabId = event.tabId
            ? event.tabId
            : useTabStore.getState().currentTab;

          // Check if tab needs to be refreshed.
          if (!event.newTab) {
            if (
              !event.refresh &&
              tabId &&
              event.item.id === useTabStore.getState().getNoteIdForTab(tabId) &&
              !localTabState.current?.needsRefresh(
                tabId,
                isLockedNote,
                item.readonly
              )
            ) {
              commands.setLoading(false, tabId);
              return;
            } else {
              localTabState.current?.setEditTime(
                item.id,
                localTabState.current?.noteEditedTime[item.id] ||
                  item.dateEdited
              );
              localTabState.current?.set(tabId!, {
                editedAt:
                  localTabState.current?.noteEditedTime[item.id] ||
                  item.dateEdited
              });
            }
          }

          currentLoadingNoteId.current = item.id;

          // Show loading overlay if note is not already loaded.
          if (
            tabId &&
            (event.item?.id !== useTabStore.getState().getNoteIdForTab(tabId) ||
              !currentContents.current[event.item.id]?.data)
          ) {
            await commands.setLoading(true, tabId);
          }

          const session: Partial<TabSessionItem> = event.session || {
            noteId: event.item.id
          };

          session.noteLocked = isLockedNote;
          session.locked = tabLocked;
          session.readonly = item.readonly;

          const tab = useTabStore.getState().getTab(tabId!);

          if (useTabStore.getState().tabs.length === 0 || event.newTab) {
            useTabStore.getState().newTab({
              session: session
            });
          } else {
            // A new session is created if the note is changed.
            // If the note is already opened, the session is updated.
            if (
              !tab?.session ||
              (event.item.id !== tab?.session?.noteId && tab?.session?.noteId)
            ) {
              useTabStore.getState().newTabSession(tabId!, session);
            } else {
              useTabStore.getState().updateTab(tabId!, {
                session: session
              });
            }
          }

          if (lastTabFocused.current !== tabId) return;

          if (tabBarRef.current?.page() === 2) {
            state.current.movedAway = false;
          }

          state.current.currentlyEditing = true;
          if (!tabLocked) {
            await loadContent(item);
          } else {
            commands.focus(tabId!);
          }

          lastContentChangeTime.current[item.id] = item.dateEdited;
          currentNotes.current[item.id] = item;

          if (!currentNotes.current[item.id]) return;

          editorSessionHistory.newSession(item.id);

          await commands.setStatus(
            getFormattedDate(item.dateEdited, "date-time"),
            "Saved",
            tabId!
          );
          await postMessage(NativeEvents.title, item.title, tabId);
          overlay(false);

          await postMessage(
            NativeEvents.html,
            {
              data: currentContents.current[item.id]?.data || "",
              scrollTop: tab?.session?.scrollTop,
              selection: tab?.session?.selection
            },
            tabId,
            10000
          );

          setTimeout(() => {
            if (blockIdRef.current) {
              commands.scrollIntoViewById(blockIdRef.current);
              blockIdRef.current = undefined;
            }
          }, 300);

          await commands.setTags(item);
          commands.setSettings();
          setTimeout(() => {
            if (currentLoadingNoteId.current === event.item?.id) {
              currentLoadingNoteId.current = undefined;
            }
          }, 300);
        }
        postMessage(NativeEvents.theme, theme);
      });
    },
    [
      commands,
      editorSessionHistory,
      loadContent,
      overlay,
      postMessage,
      reset,
      theme
    ]
  );

  const onSyncComplete = useCallback(
    async (
      data: Note | ContentItem | TrashItem | DeletedItem,
      isLocal?: boolean
    ) => {
      try {
        if (SettingsService.get().disableRealtimeSync && !isLocal) return;
        if (!data) return;

        if (isDeleted(data) || isTrashItem(data)) {
          const tabId = useTabStore.getState().getTabForNote(data.id);
          if (tabId !== undefined) {
            await commands.clearContent(tabId);
            useTabStore.getState().removeTab(tabId);
          }
          return;
        }

        const noteId =
          (data as ContentItem).type === "tiptap"
            ? (data as ContentItem).noteId
            : data.id;

        const note = data.type === "note" ? data : await db.notes?.note(noteId);

        lock.current = true;

        // Handle this case where note was locked on another device and synced.
        let locked = note
          ? await db.vaults.itemExists(note as ItemReference)
          : false;

        if (data.type === "tiptap") {
          locked = data.locked;
        }

        useTabStore.getState().forEachNoteTab(noteId, async (tab) => {
          const tabId = tab.id;

          let didUnlock = false;

          if (note) {
            if (!locked && tab?.session?.noteLocked) {
              if (tab?.session?.noteLocked || tab?.session?.locked) {
                if (useTabStore.getState().currentTab !== tabId) {
                  localTabState.current?.set(tabId, {
                    editedAt: 0
                  });
                }

                didUnlock = true;
                useTabStore.getState().updateTab(tabId, {
                  session: {
                    locked: false,
                    noteLocked: false
                  }
                });
              }
            } else if (!tab?.session?.noteLocked && locked) {
              useTabStore.getState().updateTab(tabId, {
                session: {
                  locked: true,
                  noteLocked: true
                }
              });
              commands.clearContent(tabId);
              if (useTabStore.getState().currentTab !== tabId) {
                commands.setLoading(true, tabId);
              }
              localTabState.current?.set(tabId, {
                editedAt: 0
              });
            }

            if (
              currentNotes.current[noteId]?.title !== note.title ||
              didUnlock
            ) {
              postMessage(NativeEvents.title, note.title, tabId);
            }
            commands.setTags(note);
            if (
              currentNotes.current[noteId]?.dateEdited !== note.dateEdited ||
              didUnlock
            ) {
              commands.setStatus(
                getFormattedDate(note.dateEdited, "date-time"),
                strings.saved(),
                tabId as string
              );
            }
            if (tab.session?.readonly !== note.readonly || didUnlock) {
              useTabStore.getState().updateTab(tabId, {
                session: {
                  readonly: note.readonly
                }
              });
            }
          }

          if (data.type === "tiptap" && note && !isLocal) {
            if (
              lastContentChangeTime.current[noteId] >= data.dateModified &&
              !didUnlock
            ) {
              return;
            }

            if (locked && isEncryptedContent(data)) {
              const decryptedContent = await db.vault?.decryptContent(data);
              if (!decryptedContent) {
                useTabStore.getState().updateTab(tab.id, {
                  session: {
                    locked: true,
                    noteLocked: true
                  }
                });
                if (useTabStore.getState().currentTab !== tabId) {
                  commands.clearContent(tabId);
                  commands.setLoading(true, tabId);
                }
              } else {
                await postMessage(
                  NativeEvents.updatehtml,
                  {
                    data: decryptedContent.data,
                    selection: tab.session?.selection,
                    scrollTop: tab.session?.scrollTop
                  },
                  tabId
                );
                currentContents.current[note.id] = decryptedContent;
              }
            } else {
              const _nextContent = data.data;
              if (
                _nextContent === currentContents.current[note.id]?.data &&
                !didUnlock
              ) {
                return;
              }

              lastContentChangeTime.current[note.id] = note.dateEdited;
              console.log(tab.session?.selection);
              await postMessage(
                NativeEvents.updatehtml,
                {
                  data: _nextContent,
                  selection: tab.session?.selection,
                  scrollTop: tab.session?.scrollTop
                },
                tabId
              );
              if (!isEncryptedContent(data)) {
                currentContents.current[note.id] =
                  data as UnencryptedContentItem;
              }
            }
          }
        });
      } catch (e) {
        DatabaseLogger.error(e as Error, "Error when applying sync changes");
      } finally {
        lock.current = false;
      }
    },
    [postMessage, commands]
  );

  useEffect(() => {
    const subs = [
      db.eventManager.subscribe(EVENTS.syncItemMerged, onSyncComplete),
      eSubscribeEvent(eOnLoadNote + editorId, loadNote),
      eSubscribeEvent(eUpdateNoteInEditor, onSyncComplete)
    ];
    return () => {
      subs.forEach((sub) => sub?.unsubscribe());
    };
  }, [editorId, loadNote, onSyncComplete]);

  const saveContent = useCallback(
    ({
      title,
      content,
      type,
      ignoreEdit,
      noteId,
      tabId,
      pendingChanges
    }: {
      noteId?: string;
      title?: string;
      content?: string;
      type: string;
      ignoreEdit: boolean;
      tabId: string;
      pendingChanges?: boolean;
    }) => {
      DatabaseLogger.log(
        `saveContent... title: ${!!title}, content: ${!!content}, noteId: ${noteId}`
      );
      if (
        lock.current ||
        (currentLoadingNoteId.current &&
          currentLoadingNoteId.current === noteId)
      ) {
        DatabaseLogger.log(`Skipped saving content:

          lock.current: ${lock.current}
          currentLoadingNoteId.current: ${currentLoadingNoteId.current}
        `);
        if (lock.current) {
          setTimeout(() => {
            if (lock.current) {
              DatabaseLogger.warn("Editor force removed lock after 5 seconds");
              lock.current = false;
            }
          }, 5000);
        }
        return;
      }

      if (noteId) {
        lastContentChangeTime.current[noteId] = Date.now();
        localTabState.current?.setEditTime(noteId, Date.now());
        localTabState?.current?.set(tabId, {
          editedAt: Date.now()
        });
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
        ignoreEdit,
        sessionHistoryId: noteId ? editorSessionHistory.get(noteId) : undefined,
        tabId: tabId,
        pendingChanges
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
          if (useSettingStore.getState().isAppLoading) {
            const sub = useSettingStore.subscribe((state) => {
              if (!state.isAppLoading) {
                saveNote(params);
                sub();
              }
            });
          } else {
            saveNote(params);
          }
        },
        ignoreEdit ? 0 : 150
      );
    },
    [editorSessionHistory, withTimer, onChange, saveNote]
  );

  const restoreEditorState = useCallback(async () => {
    const appState = getAppState();
    if (!appState) return;
    state.current.isRestoringState = true;
    state.current.currentlyEditing = true;
    if (tabBarRef.current?.page() === 2) {
      state.current.movedAway = false;
    }

    if (!state.current.editorStateRestored) {
      state.current.isRestoringState = true;
      if (!DDS.isTab) {
        tabBarRef.current?.goToPage(1, false);
      }
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
        useTabStore.getState().currentTab!
      ))
    ) {
      localTabState.current?.set(useTabStore.getState().currentTab!, {
        editedAt: 0
      });
      eSendEvent(eEditorReset, "onReady");
      return false;
    } else {
      syncTabs();
      isDefaultEditor && restoreEditorState();
      return true;
    }
  }, [isDefaultEditor, restoreEditorState]);

  const onLoad = useCallback(async () => {
    const isAppLoading = useSettingStore.getState().isAppLoading;
    if (isAppLoading) {
      const sub = useSettingStore.subscribe((state) => {
        if (!state.isAppLoading) {
          sub();
          onLoad();
        }
      });
      return;
    }

    setTimeout(() => {
      postMessage(NativeEvents.theme, theme);
    });
    commands.setInsets(
      isDefaultEditor ? insets : { top: 0, left: 0, right: 0, bottom: 0 }
    );
    await commands.setSettings();

    localTabState.current?.set(useTabStore.getState().currentTab!, {
      editedAt: 0
    });

    if (!state.current.ready) {
      state.current.ready = true;
    }

    if (!state.current?.initialLoadCalled) {
      const url = await Linking.getInitialURL();
      let noteId = url && new URL(url).searchParams.get("id");
      if (noteId) {
        const note = await db.notes?.note(noteId);
        if (note) {
          loadNote({
            item: note
          });
        }
        tabBarRef.current?.goToPage(1);
      } else {
        noteId = useTabStore.getState().getCurrentNoteId() || null;
        if (!noteId) {
          loadNote({ newNote: true });
          if (tabBarRef.current?.page() === 1) {
            state.current.currentlyEditing = false;
          }
        } else {
          const note = await db.notes.note(noteId);
          if (note) {
            loadNote({
              item: note
            });
          }
        }
      }
      state.current.initialLoadCalled = true;
      overlay(false);
    }
  }, [
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
    overlay,
    postMessage,
    currentLoadingNoteId
  };
};

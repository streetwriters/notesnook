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

import { createPersistedStore } from "../common/store";
import { useStore as useNoteStore } from "./note-store";
import { store as appStore } from "./app-store";
import { useStore as useSettingStore } from "./setting-store";
import { db } from "../common/db";
import BaseStore from ".";
import { EV, EVENTS } from "@notesnook/core";
import { logger } from "../utils/logger";
import Config from "../utils/config";
import { setDocumentTitle } from "../utils/dom";
import {
  BaseTrashItem,
  ContentItem,
  DatabaseUpdatedEvent,
  Item,
  MaybeDeletedItem,
  Note,
  Tag,
  isDeleted,
  isTrashItem,
  NoteContent
} from "@notesnook/core";
import { showToast } from "../utils/toast";
import { getId } from "@notesnook/core";
import { PersistStorage } from "zustand/middleware";
import {
  getFormattedHistorySessionDate,
  isFeatureAvailable,
  TabHistory,
  TabSessionHistory
} from "@notesnook/common";
import { isCipher } from "@notesnook/core";
import { AppEventManager, AppEvents } from "../common/app-events";
import Vault from "../common/vault";
import { Mutex } from "async-mutex";
import { useEditorManager } from "../components/editor/manager";
import { Context } from "../components/list-container/types";

export enum SaveState {
  NotSaved = -1,
  Saving = 0,
  Saved = 1
}
enum SESSION_STATES {
  new,
  old,
  locked,
  unlocked,
  conflicted
}

export type TabItem = {
  id: string;
  sessionId: string;
  groupId: string;
  pinned?: boolean;
};

export type EditorGroup = {
  id: string;
  activeTabId?: string;
};

export type LayoutNode = {
  id: string;
  type: "group" | "split";
  direction?: "vertical" | "horizontal";
  children?: LayoutNode[];
  groupId?: string;
  size?: number | string;
};

export type BaseEditorSession = {
  tabId: string;

  id: string;
  needsHydration?: boolean;
  title?: string;

  /**
   * The id of block to scroll to after opening the session successfully.
   */
  activeBlockId?: string;
  /**
   * The id of search result to scroll to after opening the session successfully.
   */
  activeSearchResultId?: string;
  /**
   * Used for force refreshing a session.
   */
  nonce?: number;
};

export type LockedEditorSession = BaseEditorSession & {
  type: "locked";
  note: Note;
};

export type ReadonlyEditorSession = BaseEditorSession & {
  type: "readonly";
  note: Note;
  content?: NoteContent<false>;
  color?: string;
  tags?: Tag[];
  locked?: boolean;
  attachmentsLength?: number;
};

export type DeletedEditorSession = BaseEditorSession & {
  type: "deleted";
  note: BaseTrashItem<Note>;
  content?: NoteContent<false>;
};

export type DefaultEditorSession = BaseEditorSession & {
  type: "default";
  note: Note;
  content?: NoteContent<false>;
  sessionId: string;
  color?: string;
  tags?: Tag[];
  locked?: boolean;
  attachmentsLength?: number;
  saveState: SaveState;
};

export type NewEditorSession = BaseEditorSession & {
  type: "new";
  saveState: SaveState;
  content?: NoteContent<false>;
};

export type ConflictedEditorSession = BaseEditorSession & {
  type: "conflicted";
  note: Note;
  content?: ContentItem;
};

export type DiffEditorSession = BaseEditorSession & {
  type: "diff";
  note: Note;
  content: ContentItem;
  oldTitle?: string;
  historySessionId: string;
};

export type EditorSession =
  | DefaultEditorSession
  | LockedEditorSession
  | NewEditorSession
  | ConflictedEditorSession
  | DiffEditorSession
  | ReadonlyEditorSession
  | DeletedEditorSession;

export type SessionType = keyof SessionTypeMap;
type SessionTypeMap = {
  default: DefaultEditorSession;
  locked: LockedEditorSession;
  new: NewEditorSession;
  conflicted: ConflictedEditorSession;
  diff: DiffEditorSession;
  readonly: ReadonlyEditorSession;
  deleted: DeletedEditorSession;
};

export type DocumentPreview = {
  url?: string;
  hash: string;
  title?: string;
};

export function isLockedSession(session: EditorSession): boolean {
  return (
    session.type === "locked" ||
    ((session.type === "default" || session.type === "readonly") &&
      !!session.locked) ||
    ("content" in session &&
      !!session.content &&
      "locked" in session.content &&
      session.content.locked)
  );
}

const tabSessionHistory = new TabSessionHistory({
  get() {
    return {
      tabSessionHistory: useEditorStore.getState().tabHistory,
      canGoBack: useEditorStore.getState().canGoBack,
      canGoForward: useEditorStore.getState().canGoForward
    };
  },
  set(state) {
    useEditorStore.setState({
      tabHistory: state.tabSessionHistory,
      canGoBack: state.canGoBack,
      canGoForward: state.canGoForward
    });
  }
});

const saveMutex = new Mutex();

class EditorStore extends BaseStore<EditorStore> {
  tabs: TabItem[] = [];
  groups: EditorGroup[] = [{ id: "main" }];
  layout: LayoutNode = {
    id: "root-layout",
    type: "group",
    groupId: "main"
  };
  activeGroupId = "main";
  tabHistory: TabHistory = {};
  canGoBack = false;
  canGoForward = false;
  sessions: EditorSession[] = [];

  arePropertiesVisible = false;
  documentPreview?: DocumentPreview;
  isTOCVisible = Config.get("editor:toc", false);
  editorMargins = Config.get("editor:margins", true);
  history: string[] = [];

  getActiveGroup = () => {
    const { groups, activeGroupId } = this.get();
    return groups.find((g) => g && g.id === activeGroupId) || groups[0];
  };

  getGroup = (groupId: string) => {
    return this.get().groups.find((g) => g.id === groupId);
  };

  getSession = <T extends SessionType[]>(id: string, types?: T) => {
    return this.get().sessions.find(
      (s): s is SessionTypeMap[T[number]] =>
        s && s.id === id && (!types || types.includes(s.type))
    );
  };

  getSessionsForNote = (noteId: string) => {
    return this.get().sessions.filter(
      (s) => s && "note" in s && s.note.id === noteId
    );
  };

  getTabsForNote = (noteId: string) => {
    const { tabs, sessions } = this.get();
    return tabs.filter((t) =>
      sessions.some(
        (s) =>
          t && s && t.sessionId === s.id && "note" in s && s.note.id === noteId
      )
    );
  };

  init = () => {
    const isSingleNote =
      new URLSearchParams(window.location.search).get("singleNote") === "true";

    if (isSingleNote && this.get().sessions.length === 0) {
      this.set({
        tabs: [],
        groups: [{ id: "main" }],
        layout: {
          id: "root-layout",
          type: "group",
          groupId: "main"
        },
        activeGroupId: "main",
        sessions: []
      });
    }

    useSettingStore.subscribe(
      (s) => s.hideNoteTitle,
      (state) => {
        setDocumentTitle(
          state ? this.get().getActiveSession()?.title : undefined
        );
      }
    );

    db.eventManager.subscribe(EVENTS.userLoggedOut, () => {
      const { closeTabs, tabs } = this.get();
      closeTabs(...tabs.filter((t) => !!t).map((s) => s.id));
    });

    EV.subscribe(EVENTS.vaultLocked, () => {
      this.set((state) => {
        state.sessions = state.sessions.map((session) => {
          if (isLockedSession(session)) {
            if (
              session.type === "diff" ||
              session.type === "deleted" ||
              session.type === "new"
            )
              return session;

            return <LockedEditorSession>{
              type: "locked",
              id: session.id,
              note: session.note,
              tabId: session.tabId
            };
          }
          return session;
        });
      });
    });

    db.eventManager.subscribe(
      EVENTS.syncItemMerged,
      (item?: MaybeDeletedItem<Item>) => {
        if (!item) return;
        const { sessions, closeTabs, updateSession, openSession } = this.get();
        const clearIds: string[] = [];
        for (const session of sessions) {
          if (session.type === "new") continue;
          const noteId = isDeleted(item)
            ? null
            : item.type === "note"
            ? item.id
            : item.type === "tiptap"
            ? item.noteId
            : null;
          if (noteId && session.note.id !== noteId) continue;
          if (isDeleted(item) || isTrashItem(item))
            clearIds.push(session.tabId);
          // if a note becomes conflicted, reopen the session
          else if (
            session.type !== "conflicted" &&
            item.type === "tiptap" &&
            item.conflicted
          )
            waitForSync().then(() =>
              openSession(session.note.id, { force: true, silent: true })
            );
          // if a note is locked, reopen the session
          else if (
            session.type === "default" &&
            !session.locked &&
            item.type === "tiptap" &&
            item.locked
          ) {
            waitForSync().then(() =>
              openSession(session.note.id, { force: true, silent: true })
            );
          }
          // if locked note is unlocked, reopen the session
          else if (
            (session.type === "locked" ||
              (session.type === "default" && session.locked)) &&
            item.type === "tiptap" &&
            !item.locked
          ) {
            waitForSync().then(() =>
              openSession(session.note.id, { force: true, silent: true })
            );
          }
          // if a deleted note is restored, reopen the session
          else if (session.type === "deleted" && item.type === "note") {
            openSession(session.note.id, { force: true, silent: true });
          }
          // if a readonly note is made editable, reopen the session
          else if (
            session.type === "readonly" &&
            item.type === "note" &&
            !item.readonly
          )
            openSession(session.note.id, { force: true, silent: true });
          // update the note in all sessions
          else if (item.type === "note") {
            updateSession(
              session.id,
              [session.type],
              (session) => (session.note = item)
            );
          }
        }
        if (clearIds.length > 0) closeTabs(...clearIds);
      }
    );

    db.eventManager.subscribe(
      EVENTS.databaseUpdated,
      async (event: DatabaseUpdatedEvent) => {
        const { sessions, openSession, closeTabs, updateSession, tabs } =
          this.get();
        const clearIds: string[] = [];
        if (event.collection === "notes") {
          // when a note is permanently deleted from trash
          if (event.type === "softDelete" || event.type === "delete") {
            clearIds.push(
              ...sessions
                .filter(
                  (session) =>
                    "note" in session &&
                    event.ids.includes(session.note.id) &&
                    tabs.some((tab) => tab.sessionId === session.id)
                )
                .map((s) => s.tabId)
            );
          } else if (event.type === "update") {
            for (const session of sessions) {
              if (
                session.type === "new" ||
                !event.ids.includes(session.note.id)
              )
                continue;

              if (
                // when a note's readonly property is toggled
                (session.type !== "readonly" && !!event.item.readonly) ||
                (session.type === "readonly" && !event.item.readonly) ||
                // when a note is restored from trash
                (session.type === "deleted" && event.item.type !== "trash")
              ) {
                openSession(session.note.id, { force: true, silent: true });
              } else if (
                // when a note is moved to trash
                session.type !== "deleted" &&
                event.item.type === "trash"
              ) {
                for (const tab of tabs) {
                  if (tab.sessionId === session.id) {
                    clearIds.push(session.tabId);
                  }
                }
              } else {
                updateSession(session.id, [session.type], (session) => {
                  session.note.pinned =
                    event.item.pinned ?? session.note.pinned;
                  session.note.localOnly =
                    event.item.localOnly ?? session.note.localOnly;
                  session.note.favorite =
                    event.item.favorite ?? session.note.favorite;
                  session.note.archived =
                    event.item.archived ?? session.note.archived;
                  session.note.dateCreated =
                    event.item.dateCreated ?? session.note.dateCreated;
                  session.note.dateEdited =
                    event.item.dateEdited ?? session.note.dateEdited;
                });
              }
            }
          }
        } else if (event.collection === "content") {
          if (event.type === "update") {
            for (const session of sessions) {
              const contentId =
                session.type !== "new" && session.note.contentId;
              if (!contentId || !event.ids.includes(contentId)) continue;
              if (
                // if note's conflict is resolved
                (session.type === "conflicted" && !event.item.conflicted) ||
                // if note becomes conflicted
                (session.type !== "conflicted" && event.item.conflicted) ||
                // if note is locked
                (session.type === "default" &&
                  !session.locked &&
                  event.item.locked) ||
                // if note is unlocked
                ((session.type === "locked" ||
                  (session.type === "default" && session.locked)) &&
                  !event.item.locked)
              ) {
                openSession(session.note.id, { force: true, silent: true });
              }
            }
          }
        } else if (event.collection === "relations") {
          if (
            event.type === "upsert" &&
            event.item.toId &&
            event.item.fromId &&
            event.item.fromType === "color" &&
            event.item.toType === "note"
          ) {
            for (const session of sessions) {
              if ("color" in session && session.note.id === event.item.toId) {
                updateSession(session.id, undefined, {
                  color: event.item.fromId
                });
              }
            }
          } else if (
            event.type === "unlink" &&
            ((event.reference.type === "color" &&
              event.types.includes("note")) ||
              (event.reference.type === "note" &&
                event.types.includes("color")))
          ) {
            for (const session of sessions) {
              const ids =
                "id" in event.reference
                  ? [event.reference.id]
                  : event.reference.ids;
              if (!("color" in session) || !session.color) continue;
              if (
                !ids.includes(session.note.id) &&
                !ids.includes(session.color)
              )
                continue;
              updateSession(session.id, undefined, {
                color: undefined
              });
            }
          } else if (
            event.type === "unlink" &&
            ((event.reference.type === "tag" && event.types.includes("note")) ||
              (event.reference.type === "note" && event.types.includes("tag")))
          ) {
            for (const session of sessions) {
              const ids =
                "id" in event.reference
                  ? [event.reference.id]
                  : event.reference.ids;
              if (!("tags" in session) || !session.tags) continue;
              if (
                !ids.includes(session.note.id) &&
                session.tags.every((t) => !ids.includes(t.id))
              )
                continue;

              updateSession(session.id, undefined, {
                tags: await db.notes.tags(session.note.id)
              });
            }
          } else if (
            event.type === "upsert" &&
            event.item.toId &&
            event.item.fromId &&
            event.item.fromType === "tag" &&
            event.item.toType === "note"
          ) {
            for (const session of sessions) {
              if ("note" in session && session.note.id === event.item.toId) {
                updateSession(session.id, undefined, {
                  tags: await db.notes.tags(event.item.toId)
                });
              }
            }
          }
        } else if (event.collection === "tags") {
          if (event.type === "update") {
            for (const session of sessions) {
              if (
                !("tags" in session) ||
                session.tags?.every((t) => !event.ids.includes(t.id))
              )
                continue;
              updateSession(session.id, undefined, {
                tags: await db.notes.tags(session.note.id)
              });
            }
          }
        }
        if (clearIds.length > 0) closeTabs(...clearIds);
      }
    );

    const { rehydrateSession, newSession, groups, layout } = this.get();
    if (groups.length === 0) {
      // Migrate old state or Init
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { tabs, activeTabId } = this.get() as any;
      if (tabs && tabs.length > 0) {
        this.set({
          groups: [{ id: "main", activeTabId: activeTabId }],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tabs: tabs.map((t: any) => ({ ...t, groupId: "main" })),
          layout: {
            id: "root-layout",
            type: "group",
            groupId: "main"
          }
        });
      } else {
        this.set({
          groups: [{ id: "main" }],
          layout: {
            id: "root-layout",
            type: "group",
            groupId: "main"
          }
        });
      }
    } else if (layout && layout.type === "group" && groups.length > 1) {
      // Migrate existing horizontal groups to layout tree
      this.set({
        layout: {
          id: "root-layout",
          type: "split",
          direction: "vertical", // Existing groups are side-by-side (Vertical Sash)
          children: groups.map((g) => ({
            id: g.id,
            type: "group",
            groupId: g.id
          }))
        }
      });
    } else if (!layout && groups.length > 0) {
      // Missing layout but have groups (e.g. during upgrade)
      this.set({
        layout: {
          id: "root-layout",
          type: groups.length > 1 ? "split" : "group",
          direction: "vertical",
          groupId: groups.length === 1 ? groups[0].id : undefined,
          children:
            groups.length > 1
              ? groups.map((g) => ({ id: g.id, type: "group", groupId: g.id }))
              : undefined
        }
      });
    }

    // Clean up corrupted state
    this.set((state) => ({
      tabs: state.tabs.filter((t) => !!t),
      groups: state.groups.filter((g) => !!g),
      sessions: state.sessions.filter((s) => !!s)
    }));

    const { groups: currentGroups } = this.get();
    for (const group of currentGroups) {
      if (group && group.activeTabId) {
        const tab = this.get().tabs.find(
          (t) => t && t.id === group.activeTabId
        );
        if (tab) rehydrateSession(tab.sessionId, true);
      }
    }

    const currentGroup = this.get().getActiveGroup();
    if (!currentGroup?.activeTabId) newSession();
  };

  private rehydrateSession = (sessionId: string, silent = false) => {
    const { openSession, openDiffSession, getSession, activateSession } =
      this.get();

    const session = getSession(sessionId);
    if (session?.type === "new") {
      activateSession(session.id, undefined, silent);
      return;
    }
    if (!session || !session.needsHydration) return;

    if (session.type === "diff")
      openDiffSession(session.note.id, session.historySessionId);
    else
      openSession(session.note.id, {
        force: true,
        silent,
        tabId: session.tabId
      });
  };

  updateSession = <T extends SessionType[] = SessionType[]>(
    id: string,
    types: T | undefined,
    partial:
      | Partial<SessionTypeMap[T[number]]>
      | ((session: SessionTypeMap[T[number]]) => void)
  ) => {
    this.set((state) => {
      const index = state.sessions.findIndex(
        (s) => s.id === id && (!types || types.includes(s.type))
      );
      if (index === -1) return;
      const session = state.sessions[index] as SessionTypeMap[T[number]];
      if (typeof partial === "function") partial(session);
      else {
        for (const key in partial) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          session[key] = partial[key] as any;
        }
      }
    });
  };

  activateSession = (id?: string, activeBlockId?: string, silent?: boolean) => {
    const session = this.get().sessions.find((s) => s.id === id);
    if (!session) id = undefined;

    const activeSession = this.getActiveSession();
    if (activeSession) {
      this.saveSessionContentIfNotSaved(activeSession.id);
    }

    if (
      id &&
      !useSettingStore.getState().hideNoteTitle &&
      session &&
      "note" in session
    ) {
      setDocumentTitle(session.note.title);
    } else setDocumentTitle();

    AppEventManager.publish(AppEvents.toggleEditor, true);

    if (activeBlockId && session)
      this.updateSession(session.id, [session.type], {
        activeBlockId
      });

    if (session?.tabId) {
      const { tabs } = this.get();
      const tabIndex = tabs.findIndex((t) => t && t.id === session.tabId);
      // no need to focus tab if the same session is already open
      const tab = tabs[tabIndex];
      const group = this.get().getGroup(tab.groupId);

      if (
        tabIndex === -1 ||
        (group?.activeTabId === session.tabId &&
          tabs[tabIndex].sessionId === session.id)
      )
        return;
      this.set((state) => (state.tabs[tabIndex].sessionId = session.id));
      if (!silent) this.focusTab(session.tabId, session.id);
    }
  };

  openDiffSession = async (noteId: string, sessionId: string) => {
    const session = await db.noteHistory.session(sessionId);
    const note = await db.notes.note(noteId);
    if (!session || !note) return;

    const currentContent = note.contentId
      ? await db.content.get(note.contentId)
      : undefined;
    const oldContent = await db.noteHistory.content(session.id);
    if (!oldContent) return;

    const { getSession, addSession, sessions, getActiveTab, tabs } = this.get();

    const tabId = getActiveTab()?.pinned
      ? this.addTab(getId())
      : getActiveTab()?.id || this.addTab(getId());
    const tab = tabs.find((t) => t.id === tabId);
    const activeSession = tab && getSession(tab.sessionId);
    const oldSession = sessions.find(
      (s) =>
        s.type === "diff" &&
        s.historySessionId === session.id &&
        s.tabId === tabId
    );
    const tabSessionId =
      activeSession?.needsHydration || activeSession?.type === "new"
        ? activeSession.id
        : tabSessionHistory.add(tabId, oldSession?.id);

    const label = getFormattedHistorySessionDate(session);
    addSession({
      type: "diff",
      id: tabSessionId,
      note,
      tabId,
      title: label,
      oldTitle: oldContent.title,
      historySessionId: session.id,
      content: {
        type: oldContent.type || "tiptap",
        dateCreated: session.dateCreated,
        dateEdited: session.dateModified,
        dateModified: session.dateModified,
        id: session.id,
        localOnly: false,
        noteId,
        conflicted: currentContent,
        ...(isCipher(oldContent.data)
          ? { locked: true, data: oldContent.data }
          : { locked: false, data: oldContent.data || "" })
      }
    });
  };

  openSession = async (
    noteOrId: Note | string | BaseTrashItem<Note>,
    options: {
      force?: boolean;
      newTab?: boolean;
      openInNewTab?: boolean;
      activeBlockId?: string;
      activeSearchResultId?: string;
      rawContent?: string;
      silent?: boolean;
      tabId?: string;
    } = {}
  ): Promise<string | undefined> => {
    const {
      sessions,
      activateSession,
      rehydrateSession,
      addTab,
      tabs,
      getTabsForNote,
      getSession
    } = this.get();
    const noteId = typeof noteOrId === "string" ? noteOrId : noteOrId.id;
    if (!noteId) return;
    const activeGroupId = this.get().activeGroupId;
    const oldTabForNote = options.force
      ? null
      : getTabsForNote(noteId).find((t) => t.groupId === activeGroupId);
    const activeTab = this.get().getActiveTab();
    const isReactivatingTab =
      !options.tabId &&
      options.force &&
      getTabsForNote(noteId).some((t) => t.id === activeTab?.id);
    const tabId =
      options.tabId ||
      // if a tab is pinned then always open a new tab.
      (options.openInNewTab ||
      (activeTab?.pinned && !oldTabForNote && !isReactivatingTab)
        ? addTab(getId())
        : oldTabForNote?.id || activeTab?.id || addTab(getId()));

    const tab = tabs.find((t) => t && t.id === tabId);
    const activeSession = tab && getSession(tab.sessionId);
    const noteAlreadyOpened =
      activeSession &&
      "note" in activeSession &&
      activeSession.note.id === noteId &&
      // we should allow opening the same note again if a diff session of a note
      // is opened in the same tab. This allows for cases where a user opens a diff
      // and then wants to open the note in the same tab again.
      activeSession.type !== "diff";
    if (noteAlreadyOpened && !options.force) {
      activeSession.needsHydration
        ? rehydrateSession(activeSession.id)
        : activateSession(activeSession.id, options.activeBlockId);
      return activeSession.id;
    }

    if (activeSession && "note" in activeSession)
      await db.fs().cancel(activeSession.note.id);

    const note =
      typeof noteOrId === "object" && !activeSession?.needsHydration
        ? noteOrId
        : (await db.notes.note(noteId)) || (await db.notes.trashed(noteId));
    if (!note) return;

    const oldSessionOfNote = sessions.find(
      (s) => "note" in s && s.note.id === noteId && s.tabId === tabId
    );
    const sessionId =
      activeSession?.needsHydration ||
      activeSession?.type === "new" ||
      noteAlreadyOpened
        ? activeSession.id
        : tabSessionHistory.add(tabId, oldSessionOfNote?.id);
    const isLocked = await db.vaults.itemExists(note);

    if (note.conflicted) {
      const content = note.contentId
        ? await db.content.get(note.contentId)
        : undefined;

      if (!content || !content.conflicted || note.type === "trash") {
        note.conflicted = false;
        await db.notes.add({ id: note.id, conflicted: false });
        if (content?.locked) {
          await db.content.add({
            id: note.contentId,
            dateResolved: Date.now()
          });
        }
        return this.openSession(note, { ...options, force: true });
      }

      this.addSession(
        {
          type: "conflicted",
          content: content,
          id: sessionId,
          note,
          activeBlockId: options.activeBlockId,
          tabId
        },
        options
      );
    } else if (isLocked && note.type !== "trash") {
      this.addSession(
        {
          type: "locked",
          id: sessionId,
          note,
          activeBlockId: options.activeBlockId,
          tabId
        },
        options
      );
    } else {
      const content = note.contentId
        ? await db.content.get(note.contentId)
        : undefined;

      if (content?.locked) {
        await Vault.lockNote(noteId);
        return this.openSession(note, { ...options, force: true });
      }

      if (note.type === "trash") {
        this.addSession(
          {
            type: "deleted",
            note,
            id: sessionId,
            content,
            activeBlockId: options.activeBlockId,
            activeSearchResultId: options.activeSearchResultId,
            tabId
          },
          options
        );
      } else {
        const attachmentsLength = await db.attachments
          .ofNote(note.id, "all")
          .count();
        const tags = await db.notes.tags(note.id);
        const colors = await db.relations.to(note, "color").get();
        if (note.readonly) {
          this.addSession(
            {
              type: "readonly",
              note,
              id: sessionId,
              content:
                options.rawContent && content
                  ? { data: options.rawContent, type: content.type }
                  : content,
              color: colors[0]?.fromId,
              tags,
              activeBlockId: options.activeBlockId,
              activeSearchResultId: options.activeSearchResultId,
              tabId,
              attachmentsLength
            },
            options
          );
        } else {
          this.addSession(
            {
              type: "default",
              id: sessionId,
              note,
              saveState: SaveState.Saved,
              sessionId: `${Date.now()}`,
              attachmentsLength,
              tags,
              color: colors[0]?.fromId,
              content:
                options.rawContent && content
                  ? { ...content, data: options.rawContent }
                  : content,
              activeBlockId: options.activeBlockId,
              activeSearchResultId: options.activeSearchResultId,
              tabId
            },
            options
          );
        }
      }
    }
    return sessionId;
  };

  openSessionInTab = async (noteId: string, tabId: string) => {
    const { tabs } = this.get();
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) {
      this.openSession(noteId, { openInNewTab: true });
      return;
    }

    this.focusTab(tabId);
    this.openSession(noteId, { force: true });
  };

  focusNextTab = () => {
    const { tabs, getActiveGroup } = this.get();
    const activeTabId = getActiveGroup()?.activeTabId;
    if (tabs.length <= 1) return;

    const index = tabs.findIndex((s) => s.id === activeTabId);
    if (index === -1) return;
    return this.focusTab(tabs[index === tabs.length - 1 ? 0 : index + 1].id);
  };

  focusPreviousTab = () => {
    const { tabs, getActiveGroup } = this.get();
    const activeTabId = getActiveGroup()?.activeTabId;
    if (tabs.length <= 1) return;

    const index = tabs.findIndex((s) => s.id === activeTabId);
    if (index === -1) return;
    return this.focusTab(tabs[index === 0 ? tabs.length - 1 : index - 1].id);
  };

  focusLastActiveTab = () => {
    const { tabs, history, focusTab } = this.get();
    if (tabs.length < 2 || history.length < 2) return;

    const previousTab = history.at(-2);
    if (!previousTab) return;

    focusTab(previousTab);
  };

  goBack = async () => {
    const activeTabId = this.get().getActiveGroup()?.activeTabId;
    if (!activeTabId || !tabSessionHistory.canGoBack(activeTabId)) return;
    const sessionId = tabSessionHistory.back(activeTabId);
    if (!sessionId) return;
    if (!(await this.goToSession(activeTabId, sessionId))) {
      await this.goBack();
    }
  };

  goForward = async () => {
    const activeTabId = this.get().getActiveGroup()?.activeTabId;
    if (!activeTabId || !tabSessionHistory.canGoForward(activeTabId)) return;
    const sessionId = tabSessionHistory.forward(activeTabId);
    if (!sessionId) return;
    if (!(await this.goToSession(activeTabId, sessionId))) {
      await this.goForward();
    }
  };

  goToSession = async (tabId: string, sessionId: string) => {
    const session = this.get().getSession(sessionId);
    if (!session) {
      tabSessionHistory.remove(tabId, sessionId);
      return false;
    }

    if (session.type === "new") {
      this.activateSession(session.id);
      return true;
    } else {
      if (!(await db.notes.exists(session.note.id))) {
        tabSessionHistory.remove(tabId, session.id);
        this.set((state) => {
          const index = state.sessions.findIndex((s) => s.id === session.id);
          state.sessions.splice(index, 1);
        });
        return false;
      }

      // we must rehydrate the session as the note's content can be stale
      this.updateSession(session.id, undefined, {
        needsHydration: true
      });
      this.activateSession(session.id);
      return true;
    }
  };

  addSession = (
    session: EditorSession,
    options?: { force?: boolean; silent?: boolean }
  ) => {
    this.set((state) => {
      const index = state.sessions.findIndex((s) => s.id === session.id);
      if (index > -1) {
        if (options?.force)
          session.nonce = (state.sessions[index]?.nonce || 0) + 1;
        state.sessions[index] = session;
      } else state.sessions.push(session);
    });

    this.activateSession(session.id, undefined, options?.silent);
  };

  saveSession = async (
    id: string,
    partial: Partial<Omit<DefaultEditorSession, "note">> & {
      note?: Partial<Note>;
      ignoreEdit?: boolean;
    }
  ) => {
    const session = this.getSession(id, ["new", "default"]);
    if (!session) return;

    // do not allow saving of readonly session
    if (partial.note?.readonly) return;

    await saveMutex.runExclusive(async () => {
      this.setSaveState(id, 0);
      try {
        // Get session again as it might have changed to default.
        const currentSession =
          session.type === "new"
            ? this.getSession(id, ["new", "default"])
            : session;

        if (!currentSession) return;
        const sessionId = getSessionId(currentSession);
        let noteId =
          "note" in currentSession ? currentSession.note.id : partial.note?.id;

        if (isLockedSession(currentSession) && partial.content) {
          if (!noteId) return;
          logger.debug("Saving locked content", { noteId });

          noteId = await db.vault.save({
            content: partial.content,
            sessionId,
            id: noteId
          });
        } else {
          if (partial.content)
            logger.debug("Saving content", {
              noteId,
              length: partial.content.data.length
            });
          noteId = await db.notes.add({
            ...partial.note,
            dateEdited:
              partial.ignoreEdit && currentSession.type === "default"
                ? currentSession.note.dateEdited
                : undefined,
            contentId:
              currentSession.type === "default"
                ? currentSession.note.contentId
                : undefined,
            content: partial.content,
            sessionId,
            id: noteId
          });
        }

        const note = noteId && (await db.notes.note(noteId));
        if (!note) throw new Error("Note not saved.");

        if (currentSession.type === "new") {
          const context = useNoteStore.getState().context;
          await addNotebook(note, context);
          await addTag(note, context);
          await addColor(note, context);
        }

        const attachmentsLength = await db.attachments
          .ofNote(note.id, "all")
          .count();
        const shouldRefreshNotes =
          currentSession.type === "new" ||
          note.title !== currentSession.note?.title ||
          note.headline !== currentSession.note?.headline ||
          attachmentsLength !== currentSession.attachmentsLength;
        if (shouldRefreshNotes) useNoteStore.getState().refresh();

        if (currentSession.type === "new") {
          await this.openSession(note, { force: true });
        } else {
          // update any conflicted session that has the same content opened
          if (partial.content) {
            const content = partial.content;
            this.set((state) => {
              const session = state.sessions.find(
                (s): s is ConflictedEditorSession =>
                  (s.type === "diff" || s.type === "conflicted") &&
                  !!s.content?.conflicted &&
                  s.content.conflicted.id === currentSession.note.contentId &&
                  s.content.conflicted.dateEdited ===
                    currentSession.note.dateEdited
              );
              if (!session || !session.content?.conflicted) return;
              session.content.conflicted.data = content.data;
              session.content.conflicted.dateEdited = note.dateEdited;
            });
          }

          this.updateSession(id, ["default"], {
            attachmentsLength: attachmentsLength,
            note,
            sessionId
          });
        }

        if (partial.note?.title !== undefined) {
          const { sessions } = this.get();
          for (const session of sessions) {
            if ("note" in session && session.note.id === note.id) {
              this.updateSession(session.id, undefined, {
                note,
                title: note.title
              });
            }
          }
        }

        setDocumentTitle(
          useSettingStore.getState().hideNoteTitle ? undefined : note.title
        );
        this.setSaveState(id, SaveState.Saved);
      } catch (err) {
        showToast(
          "error",
          err instanceof Error && err.stack
            ? err.message + err.stack
            : JSON.stringify(err)
        );
        this.setSaveState(id, SaveState.NotSaved);
        console.error(err);
        if (err instanceof Error) logger.error(err);
        if (isLockedSession(session) && "note" in session) {
          this.get().openSession(session.note, { force: true });
        }
      }
    });
  };

  saveSessionContentIfNotSaved = (sessionId: string) => {
    const sessionSaveState = this.getSession(sessionId, ["default"])?.saveState;
    if (sessionSaveState === SaveState.NotSaved) {
      const editor = useEditorManager.getState().getEditor(sessionId);
      const content = editor?.editor?.getContent();
      this.saveSession(
        sessionId,
        content
          ? {
              content: {
                data: content,
                type: "tiptap"
              }
            }
          : {}
      );
    }
  };

  newSession = (groupId?: string) => {
    const { activateSession, getActiveTab } = this.get();
    const activeTabId = getActiveTab(groupId)?.id;
    if (!activeTabId || getActiveTab(groupId)?.pinned) {
      this.addTab(undefined, groupId);
      return;
    }

    const session = this.getActiveSession();
    if (session?.type === "new") return activateSession(session.id);

    const sessionId = tabSessionHistory.add(activeTabId);
    this.addSession({
      type: "new",
      id: sessionId,
      tabId: activeTabId, // Use the correct activeTabId for the group
      saveState: SaveState.NotSaved
    });
  };

  closeActiveTab = () => {
    const { getActiveGroup } = this.get();
    const activeTabId = getActiveGroup()?.activeTabId;
    if (!activeTabId) return;
    this.closeTabs(activeTabId);
  };

  closeAllTabs = () => {
    const { tabs } = this.get();
    this.closeTabs(...tabs.filter((t) => !!t).map((t) => t.id));
  };

  closeNotes = (...noteIds: string[]) => {
    const { getTabsForNote, closeTabs } = this.get();
    const tabs = noteIds
      .map((id) => getTabsForNote(id))
      .flat()
      .map((t) => t.id);
    closeTabs(...tabs);
  };

  closeTabs = (...ids: string[]) => {
    this.set((state) => {
      const tabs: TabItem[] = [];
      for (let i = 0; i < state.tabs.length; ++i) {
        const tab = state.tabs[i];
        if (!tab) continue;
        if (!ids.includes(tab.id)) {
          tabs.push(tab);
          continue;
        }

        this.saveSessionContentIfNotSaved(tab.sessionId);

        db.fs().cancel(tab.sessionId).catch(console.error);
        if (state.history.includes(tab.id))
          state.history.splice(state.history.indexOf(tab.id), 1);

        const tabHistory = tabSessionHistory.getTabHistory(tab.id);
        state.sessions = state.sessions.filter((session) => {
          return (
            !tabHistory.back.includes(session.id) &&
            !tabHistory.forward.includes(session.id)
          );
        });
        tabSessionHistory.clearStackForTab(tab.id);
      }
      state.tabs = tabs;
    });

    const { history } = this.get();
    this.focusTab(history.pop());
    const remainingTabs = this.get().tabs;
    if (remainingTabs.length === 0) this.addTab();
    else if (
      this.get().groups.some(
        (g) => !remainingTabs.find((t) => t.groupId === g.id)
      )
    ) {
      // Ensure every group has at least one tab
      this.get().groups.forEach((group) => {
        if (!remainingTabs.find((t) => t.groupId === group.id)) {
          // if there is more than one group, close the group
          if (this.get().groups.length > 1) {
            this.closeGroup(group.id);
          } else {
            this.addTab(undefined, group.id);
          }
        }
      });
    }
  };

  setTitle = (id: string, title: string) => {
    return this.saveSession(id, { note: { title } });
  };

  toggle = (
    id: string,
    name: "favorite" | "pinned" | "readonly" | "localOnly" | "color",
    value: boolean | string
  ) => {
    if (name === "color" && typeof value === "string")
      return this.updateSession(id, ["readonly", "default"], { color: value });
    return this.saveSession(id, { note: { [name]: value } });
  };

  saveSessionContent = (
    id: string,
    ignoreEdit: boolean,
    content: NoteContent<false>
  ) => {
    return this.saveSession(id, { content, ignoreEdit });
  };

  setSaveState = (id: string, saveState: SaveState) => {
    this.updateSession(id, ["default", "new"], { saveState: saveState });
  };

  toggleProperties = (toggleState?: boolean) => {
    this.set((state) => {
      state.arePropertiesVisible =
        toggleState !== undefined ? toggleState : !state.arePropertiesVisible;
    });
    this.toggleTableOfContents(false);
  };

  toggleTableOfContents = (toggleState?: boolean) => {
    const { isTOCVisible, arePropertiesVisible } = this.get();
    const isTOCVisibleState =
      toggleState !== undefined ? toggleState : !isTOCVisible;
    this.set({
      isTOCVisible: isTOCVisibleState,
      arePropertiesVisible: isTOCVisibleState ? false : arePropertiesVisible
    });
    Config.set("editor:toc", isTOCVisibleState);
  };

  toggleEditorMargins = (toggleState?: boolean) => {
    const { editorMargins } = this.get();
    const editorMarginsState =
      toggleState !== undefined ? toggleState : !editorMargins;
    this.set({ editorMargins: editorMarginsState });
    Config.set("editor:margins", editorMarginsState);
  };

  getActiveTab = (groupId?: string) => {
    const id = groupId || this.get().activeGroupId;
    const group = this.get().groups.find((g) => g && g.id === id);
    return this.get().tabs.find((t) => t && t.id === group?.activeTabId);
  };

  getActiveNote = () => {
    const session = this.getActiveSession();
    return session && "note" in session ? session.note : undefined;
  };

  isNoteOpen = (noteId: string) => {
    return this.getActiveNote()?.id === noteId;
  };

  getActiveSession = <T extends SessionType[]>(
    types?: T
  ): SessionTypeMap[T[number]] | undefined => {
    const activeTab = this.getActiveTab();
    if (!activeTab) return;
    const session = this.getSession(activeTab.sessionId);
    if (session && (!types || types.includes(session.type)))
      return session as SessionTypeMap[T[number]];
  };

  addTab = (sessionId?: string, groupId?: string) => {
    const id = getId();
    const newSessionId = sessionId || tabSessionHistory.add(id);
    const targetGroupId = groupId || this.get().activeGroupId;

    this.set((state) => {
      // Ensure group exists (safeguard)
      if (!state.groups.some((g) => g.id === targetGroupId)) {
        state.groups.push({ id: targetGroupId });
      }
      state.tabs.push({
        id,
        sessionId: newSessionId,
        groupId: targetGroupId
      });
    });
    if (!sessionId)
      this.addSession({
        type: "new",
        tabId: id,
        id: newSessionId,
        saveState: SaveState.NotSaved
      });
    this.focusTab(id);
    return id;
  };

  pinTab = (tabId: string) => {
    const { tabs: _tabs } = this.get();
    const tabs = _tabs.slice();
    const index = tabs.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    tabs[index].pinned = !tabs[index].pinned;
    tabs.sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
    useEditorStore.setState({
      tabs
    });
  };

  focusTab = (tabId: string | undefined, sessionId?: string) => {
    if (!tabId) return;

    const { history, tabs } = this.get();
    if (history.includes(tabId)) history.splice(history.indexOf(tabId), 1);
    history.push(tabId);

    const tab = tabs.find((t) => t && t.id === tabId);
    if (!tab) return;

    this.set((state) => {
      const groupIndex = state.groups.findIndex(
        (g) => g && g.id === tab.groupId
      );
      if (groupIndex !== -1) {
        state.groups[groupIndex].activeTabId = tabId;
        state.activeGroupId = tab.groupId;
      }
      state.canGoBack = !tab?.pinned && tabSessionHistory.canGoBack(tabId);
      state.canGoForward =
        !tab?.pinned && tabSessionHistory.canGoForward(tabId);
    });

    sessionId = sessionId || tab?.sessionId;
    if (sessionId) this.rehydrateSession(sessionId, true);
  };

  splitGroup = (
    direction: "vertical" | "horizontal" = "vertical",
    groupId?: string,
    tabIdToMove?: string,
    position: "before" | "after" = "after"
  ) => {
    const { activeGroupId } = this.get();
    const targetGroupId = groupId || activeGroupId;
    const newGroupId = getId();

    this.set((state) => {
      state.groups.push({ id: newGroupId });
      state.activeGroupId = newGroupId;

      const hasGroup = (node: LayoutNode, id: string): boolean => {
        if (node.type === "group") return node.groupId === id;
        return node.children?.some((c) => hasGroup(c, id)) || false;
      };

      const findAndSplit = (node: LayoutNode): LayoutNode => {
        if (node.type === "group" && node.groupId === targetGroupId) {
          const newGroupNode = {
            id: newGroupId,
            type: "group" as const,
            groupId: newGroupId
          };
          return {
            id: getId(),
            type: "split",
            direction,
            children:
              position === "after"
                ? [{ ...node }, newGroupNode]
                : [newGroupNode, { ...node }]
          };
        }
        if (node.type === "split" && node.children) {
          const index = node.children.findIndex(
            (c) =>
              (c.type === "group" && c.groupId === targetGroupId) ||
              (c.type === "split" && hasGroup(c, targetGroupId))
          );

          if (index !== -1) {
            if (node.direction === direction) {
              node.children.splice(
                position === "after" ? index + 1 : index,
                0,
                {
                  id: newGroupId,
                  type: "group",
                  groupId: newGroupId
                }
              );

              // reset sizes so they get redistributed evenly
              for (const child of node.children) {
                delete child.size;
              }
            } else {
              node.children[index] = findAndSplit(node.children[index]);
            }
          }
        }
        return node;
      };

      state.layout = findAndSplit(state.layout);
    });
    if (tabIdToMove) {
      this.moveTab(tabIdToMove, newGroupId);
    } else {
      this.addTab(undefined, newGroupId);
    }
  };

  closeGroup = (groupId: string) => {
    const { groups } = this.get();
    if (groups.length <= 1) return; // Don't close the last group

    // Close all tabs in this group
    const tabs = this.get().tabs.filter((t) => t && t.groupId === groupId);
    if (tabs.length > 0) this.closeTabs(...tabs.map((t) => t.id));

    this.set((state) => {
      state.groups = state.groups.filter((g) => g.id !== groupId);
      if (state.activeGroupId === groupId) {
        state.activeGroupId = state.groups[0].id;
      }

      const removeFromLayout = (node: LayoutNode): LayoutNode | null => {
        if (node.type === "group") {
          return node.groupId === groupId ? null : node;
        }
        if (node.type === "split" && node.children) {
          node.children = node.children
            .map(removeFromLayout)
            .filter((n) => n !== null) as LayoutNode[];

          if (node.children.length === 1) {
            return node.children[0];
          }
          if (node.children.length === 0) {
            return null;
          }
        }
        return node;
      };

      const newLayout = removeFromLayout(state.layout);
      if (newLayout) state.layout = newLayout;
    });
  };

  focusGroup = (groupId: string) => {
    this.set({ activeGroupId: groupId });
  };

  resizeNode = (id: string, sizes: number[]) => {
    this.set((state) => {
      const setSizes = (node: LayoutNode) => {
        if (node.id === id && node.children) {
          const totalSize = sizes.reduce((acc, size) => acc + size, 0);
          node.children.forEach((child, index) => {
            child.size = `${((sizes[index] / totalSize) * 100).toFixed(2)}%`;
          });
          return true;
        } else if (node.children) {
          for (const child of node.children) {
            if (setSizes(child)) return true;
          }
        }
        return false;
      };
      setSizes(state.layout);
    });
  };

  moveTab = (tabId: string, targetGroupId: string, newIndex?: number) => {
    const tab = this.get().tabs.find((t) => t.id === tabId);
    const sessionId = tab?.sessionId;

    this.set((state) => {
      const tabIndex = state.tabs.findIndex((t) => t && t.id === tabId);
      if (tabIndex === -1) return;

      const tab = state.tabs[tabIndex];
      const oldGroupId = tab.groupId;

      // Remove from old location
      state.tabs.splice(tabIndex, 1);
      tab.groupId = targetGroupId;

      // Calculate target index
      const targetTabs = state.tabs.filter(
        (t) => t && t.groupId === targetGroupId
      );
      let globalInsertIndex = state.tabs.length;

      if (typeof newIndex === "number") {
        // Find the global index corresponding to the local group index
        const tabAtNewIndex = targetTabs[newIndex];
        if (tabAtNewIndex) {
          globalInsertIndex = state.tabs.findIndex(
            (t) => t && t.id === tabAtNewIndex.id
          );
        } else if (targetTabs.length > 0) {
          // Insert after the last tab of the group if index is out of bounds
          const lastTab = targetTabs[targetTabs.length - 1];
          globalInsertIndex =
            state.tabs.findIndex((t) => t && t.id === lastTab.id) + 1;
        }
      }

      state.tabs.splice(globalInsertIndex, 0, tab);

      // Update active tab if moving to a new group and it was active, or just because
      if (oldGroupId !== targetGroupId) {
        // 1. Handle old group focus
        const oldGroup = state.groups.find((g) => g.id === oldGroupId);
        if (oldGroup && oldGroup.activeTabId === tab.id) {
          const remainingTabs = state.tabs.filter(
            (t) => t && t.groupId === oldGroupId
          );
          oldGroup.activeTabId =
            remainingTabs.length > 0
              ? remainingTabs[remainingTabs.length - 1].id
              : undefined;
        }

        // 2. Handle new group focus and app focus
        const targetGroup = state.groups.find((g) => g.id === targetGroupId);
        if (targetGroup) {
          targetGroup.activeTabId = tab.id;
          state.activeGroupId = targetGroupId;
        }

        // 3. Cleanup old group if empty
        const remainingTabsInOldGroup = state.tabs.filter(
          (t) => t && t.groupId === oldGroupId
        );
        if (remainingTabsInOldGroup.length === 0 && state.groups.length > 1) {
          state.groups = state.groups.filter((g) => g.id !== oldGroupId);

          const removeFromLayout = (node: LayoutNode): LayoutNode | null => {
            if (node.type === "group") {
              return node.groupId === oldGroupId ? null : node;
            }
            if (node.type === "split" && node.children) {
              node.children = node.children
                .map(removeFromLayout)
                .filter((n) => n !== null) as LayoutNode[];

              if (node.children.length === 1) {
                return node.children[0];
              }
              if (node.children.length === 0) {
                return null;
              }
            }
            return node;
          };

          const newLayout = removeFromLayout(state.layout);
          if (newLayout) state.layout = newLayout;
        }
      }
    });
    if (sessionId) this.rehydrateSession(sessionId, true);
  };
}

const searchParams = new URLSearchParams(window.location.search);
const windowSessionId = searchParams.get("windowSessionId");

const useEditorStore = createPersistedStore(EditorStore, {
  name:
    !windowSessionId || windowSessionId === "main"
      ? "editor-sessions-v2"
      : `editor-sessions-v2-${windowSessionId}`,
  partialize: (state) => ({
    history: state.history,
    arePropertiesVisible: state.arePropertiesVisible,
    editorMargins: state.editorMargins,
    groups: state.groups,
    layout: state.layout,
    activeGroupId: state.activeGroupId,
    tabs: state.tabs,
    tabHistory: state.tabHistory,
    canGoBack: state.canGoBack,
    canGoForward: state.canGoForward,
    sessions: state.sessions.reduce((sessions, session) => {
      sessions.push({
        id: session.id,
        type: isLockedSession(session) ? "locked" : session.type,
        needsHydration: session.type === "new" ? false : true,
        title: session.title,
        historySessionId:
          session.type === "diff" ? session.historySessionId : undefined,
        tabId: session.tabId,
        note:
          "note" in session
            ? {
                id: session.note.id,
                title: session.note.title
              }
            : undefined
      } as EditorSession);

      return sessions;
    }, [] as EditorSession[])
  }),
  storage: db.config() as PersistStorage<Partial<EditorStore>>,
  onRehydrateStorage: () => (state) => {
    if (!state) return;
    if (!state.groups || state.groups.length === 0) {
      state.groups = [{ id: "main" }];
      state.activeGroupId = "main";
      if (state.tabs) {
        state.tabs.forEach((t) => (t.groupId = "main"));
      }
    }
  }
}) as ReturnType<typeof createPersistedStore<EditorStore>>;
export { useEditorStore, SESSION_STATES };

const MILLISECONDS_IN_A_MINUTE = 60 * 1000;
const SESSION_DURATION = MILLISECONDS_IN_A_MINUTE * 5;
function getSessionId(session: DefaultEditorSession | NewEditorSession) {
  const sessionId =
    "sessionId" in session ? parseInt(session.sessionId) : Date.now();
  if (sessionId + SESSION_DURATION < Date.now()) return `${Date.now()}`;
  return `${sessionId}`;
}

async function waitForSync() {
  if (!appStore.get().isSyncing()) return true;
  return new Promise((resolve) => {
    db.eventManager.subscribe(EVENTS.syncCompleted, resolve, true);
  });
}

async function addNotebook(note: Note, context?: Context) {
  const defaultNotebook = db.settings.getDefaultNotebook();
  if (
    context?.type !== "notebook" &&
    defaultNotebook &&
    !(await isFeatureAvailable("defaultNotebookAndTag")).isAllowed
  )
    return;

  const notebookId =
    context?.type === "notebook" ? context.id : defaultNotebook;
  if (!notebookId) return;

  await db.notes.addToNotebook(notebookId, note.id);
}

async function addTag(note: Note, context?: Context) {
  const defaultTag = db.settings.getDefaultTag();
  if (
    context?.type !== "tag" &&
    defaultTag &&
    !(await isFeatureAvailable("defaultNotebookAndTag")).isAllowed
  )
    return;

  const tagId = context?.type === "tag" ? context.id : defaultTag;
  if (!tagId) return;

  await db.relations.add(
    { type: "tag", id: tagId },
    { type: "note", id: note.id }
  );
}

async function addColor(note: Note, context?: Context) {
  const colorId = context && context.type === "color" ? context.id : undefined;
  if (!colorId) return;

  await db.relations.add(
    { type: "color", id: colorId },
    { type: "note", id: note.id }
  );
}

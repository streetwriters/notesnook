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
import { store as settingStore } from "./setting-store";
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
  TabHistory,
  TabSessionHistory
} from "@notesnook/common";
import { isCipher } from "@notesnook/core";
import { hashNavigate } from "../navigation";
import { AppEventManager, AppEvents } from "../common/app-events";
import Vault from "../common/vault";
import { Mutex } from "async-mutex";
import { useEditorManager } from "../components/editor/manager";

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

type TabItem = {
  id: string;
  sessionId: string;
  pinned?: boolean;
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
};

export function isLockedSession(session: EditorSession): boolean {
  return (
    session.type === "locked" ||
    (session.type === "default" && !!session.locked) ||
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
  tabHistory: TabHistory = {};
  activeTabId: string | undefined;
  canGoBack = false;
  canGoForward = false;
  sessions: EditorSession[] = [];

  arePropertiesVisible = false;
  documentPreview?: DocumentPreview;
  isTOCVisible = Config.get("editor:toc", false);
  editorMargins = Config.get("editor:margins", true);
  history: string[] = [];

  getSession = <T extends SessionType[]>(id: string, types?: T) => {
    return this.get().sessions.find(
      (s): s is SessionTypeMap[T[number]] =>
        s.id === id && (!types || types.includes(s.type))
    );
  };

  getSessionsForNote = (noteId: string) => {
    return this.get().sessions.filter(
      (s) => "note" in s && s.note.id === noteId
    );
  };

  getTabsForNote = (noteId: string) => {
    const { tabs, sessions } = this.get();
    return tabs.filter((t) =>
      sessions.some(
        (s) => t.sessionId === s.id && "note" in s && s.note.id === noteId
      )
    );
  };

  init = () => {
    EV.subscribe(EVENTS.userLoggedOut, () => {
      const { closeTabs, tabs } = this.get();
      closeTabs(...tabs.map((s) => s.id));
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
        const { sessions, openSession, closeTabs, updateSession } = this.get();
        const clearIds: string[] = [];
        if (event.collection === "notes") {
          // when a note is permanently deleted from trash
          if (event.type === "softDelete" || event.type === "delete") {
            clearIds.push(
              ...sessions
                .filter(
                  (session) =>
                    "note" in session && event.ids.includes(session.note.id)
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
                clearIds.push(session.tabId);
              } else {
                updateSession(session.id, [session.type], (session) => {
                  session.note.pinned =
                    event.item.pinned ?? session.note.pinned;
                  session.note.localOnly =
                    event.item.localOnly ?? session.note.localOnly;
                  session.note.favorite =
                    event.item.favorite ?? session.note.favorite;
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
            updateSession(event.item.toId, undefined, {
              color: event.item.fromId
            });
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
            updateSession(event.item.toId, undefined, {
              tags: await db.notes.tags(event.item.toId)
            });
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

    const { rehydrateSession, activeTabId, newSession } = this.get();
    if (activeTabId) {
      const tab = this.get().tabs.find((t) => t.id === activeTabId);
      if (!tab) return;
      rehydrateSession(tab.sessionId);
    } else newSession();
  };

  private rehydrateSession = (sessionId: string) => {
    const { openSession, openDiffSession, getSession, activateSession } =
      this.get();

    const session = getSession(sessionId);
    if (session?.type === "new") {
      activateSession(session.id);
      return;
    }
    if (!session || !session.needsHydration) return;

    if (session.type === "diff")
      openDiffSession(session.note.id, session.historySessionId);
    else
      openSession(session.note.id, {
        force: true
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
          session[key] = partial[key] as any;
        }
      }
    });
  };

  activateSession = (id?: string, activeBlockId?: string, silent?: boolean) => {
    if (!id) hashNavigate(`/`, { replace: true, notify: false });

    const session = this.get().sessions.find((s) => s.id === id);
    if (!session) id = undefined;

    const activeSession = this.getActiveSession();
    if (activeSession) {
      this.saveSessionContentIfNotSaved(activeSession.id);
    }

    if (
      id &&
      !settingStore.get().hideNoteTitle &&
      session &&
      "note" in session
    ) {
      setDocumentTitle(session.note.title);
    } else setDocumentTitle();

    AppEventManager.publish(AppEvents.toggleEditor, true);

    if (id) {
      if (session?.type === "new")
        hashNavigate(`/notes/${id}/create`, { replace: true, notify: false });
      else hashNavigate(`/notes/${id}/edit`, { replace: true, notify: false });
    }

    if (activeBlockId && session)
      this.updateSession(session.id, [session.type], {
        activeBlockId
      });

    if (session?.tabId) {
      const { tabs, activeTabId } = this.get();
      const index = tabs.findIndex((t) => t.id === session.tabId);
      // no need to focus tab if the same session is already open
      if (
        index === -1 ||
        (activeTabId === session.tabId && tabs[index].sessionId === session.id)
      )
        return;
      this.set((state) => (state.tabs[index].sessionId = session.id));
      if (!silent) this.focusTab(session.tabId, session.id);
    }
  };

  openDiffSession = async (noteId: string, sessionId: string) => {
    const session = await db.noteHistory.session(sessionId);
    const note = await db.notes.note(noteId);
    if (!session || !note || !note.contentId) return;

    const currentContent = await db.content.get(note.contentId);
    const oldContent = await db.noteHistory.content(session.id);

    if (!oldContent || !currentContent) return;

    const { getSession, addSession, sessions, activeTabId, tabs } = this.get();

    const tabId = activeTabId ?? this.addTab();
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
      historySessionId: session.id,
      content: {
        type: oldContent.type,
        dateCreated: session.dateCreated,
        dateEdited: session.dateModified,
        dateModified: session.dateModified,
        id: session.id,
        localOnly: false,
        noteId,
        conflicted: currentContent,
        ...(isCipher(oldContent.data)
          ? { locked: true, data: oldContent.data }
          : { locked: false, data: oldContent.data })
      }
    });
  };

  openSession = async (
    noteOrId: string | Note | BaseTrashItem<Note>,
    options: {
      force?: boolean;
      activeBlockId?: string;
      silent?: boolean;
      openInNewTab?: boolean;
    } = {}
  ): Promise<void> => {
    const {
      getSession,
      sessions,
      tabs,
      activateSession,
      activeTabId,
      rehydrateSession,
      getTabsForNote,
      addTab
    } = this.get();
    const noteId = typeof noteOrId === "string" ? noteOrId : noteOrId.id;
    const oldTabForNote = options.force ? null : getTabsForNote(noteId).at(0);
    const tabId = options.openInNewTab
      ? addTab(getId())
      : oldTabForNote?.id || activeTabId || addTab(getId());

    const tab = tabs.find((t) => t.id === tabId);
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
      return activeSession.needsHydration
        ? rehydrateSession(activeSession.id)
        : activateSession(activeSession.id, options.activeBlockId);
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

      if (
        !content ||
        content.locked ||
        !content.conflicted ||
        note.type === "trash"
      ) {
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
        options.silent
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
        options.silent
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
            tabId
          },
          options.silent
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
              content,
              color: colors[0]?.fromId,
              tags,
              activeBlockId: options.activeBlockId,
              tabId
            },
            options.silent
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
              content,
              activeBlockId: options.activeBlockId,
              tabId
            },
            options.silent
          );
        }
      }
    }
  };

  focusNextTab = () => {
    const { tabs, activeTabId } = this.get();
    if (tabs.length <= 1) return;

    const index = tabs.findIndex((s) => s.id === activeTabId);
    if (index === -1) return;
    return this.focusTab(tabs[index === tabs.length - 1 ? 0 : index + 1].id);
  };

  focusPreviousTab = () => {
    const { tabs, activeTabId } = this.get();
    if (tabs.length <= 1) return;

    const index = tabs.findIndex((s) => s.id === activeTabId);
    if (index === -1) return;
    return this.focusTab(tabs[index === 0 ? tabs.length - 1 : index - 1].id);
  };

  goBack = async () => {
    const activeTabId = this.get().activeTabId;
    if (!activeTabId || !tabSessionHistory.canGoBack(activeTabId)) return;
    const sessionId = tabSessionHistory.back(activeTabId);
    if (!sessionId) return;
    if (!(await this.goToSession(activeTabId, sessionId))) {
      await this.goBack();
    }
  };

  goForward = async () => {
    const activeTabId = this.get().activeTabId;
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

  addSession = (session: EditorSession, silent = false) => {
    this.set((state) => {
      const index = state.sessions.findIndex((s) => s.id === session.id);
      if (index > -1) {
        state.sessions[index] = session;
      } else state.sessions.push(session);
    });

    this.activateSession(session.id, undefined, silent);
  };

  saveSession = async (
    id: string,
    partial: Partial<Omit<DefaultEditorSession, "note">> & {
      note?: Partial<Note>;
      ignoreEdit?: boolean;
    }
  ) => {
    const currentSession = this.getSession(id, ["new", "default"]);
    if (!currentSession) return;

    // do not allow saving of readonly session
    if (partial.note?.readonly) return;

    await saveMutex.runExclusive(async () => {
      this.setSaveState(id, 0);
      try {
        const sessionId = getSessionId(currentSession);
        const noteId =
          ("note" in currentSession
            ? currentSession.note.id
            : partial.note?.id) || id;

        if (isLockedSession(currentSession) && partial.content) {
          logger.debug("Saving locked content", { id });

          await db.vault.save({
            content: partial.content,
            sessionId,
            id: noteId
          });
        } else {
          if (partial.content)
            logger.debug("Saving content", {
              id,
              length: partial.content.data.length
            });
          await db.notes.add({
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

        const note = await db.notes.note(noteId);
        if (!note) throw new Error("Note not saved.");

        if (currentSession.type === "new") {
          const context = useNoteStore.getState().context;
          if (context) {
            const { type } = context;
            if (type === "notebook")
              await db.notes.addToNotebook(context.id, noteId);
            else if (type === "color" || type === "tag")
              await db.relations.add(
                { type, id: context.id },
                { id, type: "note" }
              );
          } else {
            const defaultNotebook = db.settings.getDefaultNotebook();
            if (defaultNotebook)
              await db.notes.addToNotebook(defaultNotebook, noteId);
          }
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
              session.content.conflicted.data = partial.content!.data;
              session.content.conflicted.dateEdited = note.dateEdited;
            });
          }

          this.updateSession(id, ["default"], {
            attachmentsLength: attachmentsLength,
            note,
            sessionId
          });
        }
        setDocumentTitle(
          settingStore.get().hideNoteTitle ? undefined : note.title
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
        if (isLockedSession(currentSession) && "note" in currentSession) {
          this.get().openSession(currentSession.note, { force: true });
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

  newSession = () => {
    const { activeTabId, activateSession } = this.get();
    if (!activeTabId) {
      this.addTab();
      return;
    }

    const session = this.getActiveSession();
    if (session?.type === "new") return activateSession(session.id);

    const sessionId = tabSessionHistory.add(activeTabId);
    this.addSession({
      type: "new",
      id: sessionId,
      tabId: activeTabId,
      saveState: SaveState.NotSaved
    });
  };

  closeActiveTab = () => {
    const { activeTabId } = this.get();
    if (!activeTabId) return;
    this.closeTabs(activeTabId);
  };

  closeAllTabs = () => {
    const { tabs } = this.get();
    this.closeTabs(...tabs.map((t) => t.id));
  };

  closeTabs = (...ids: string[]) => {
    this.set((state) => {
      const tabs: TabItem[] = [];
      for (let i = 0; i < state.tabs.length; ++i) {
        const tab = state.tabs[i];
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

    const { history, tabs } = this.get();
    this.focusTab(history.pop());
    if (tabs.length === 0) this.addTab();
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
    this.set(
      (state) =>
        (state.arePropertiesVisible =
          toggleState !== undefined ? toggleState : !state.arePropertiesVisible)
    );
  };

  toggleTableOfContents = (toggleState?: boolean) => {
    const { isTOCVisible } = this.get();
    const isTOCVisibleState =
      toggleState !== undefined ? toggleState : !isTOCVisible;
    this.set({ isTOCVisible: isTOCVisibleState });
    Config.set("editor:toc", isTOCVisibleState);
  };

  toggleEditorMargins = (toggleState?: boolean) => {
    const { editorMargins } = this.get();
    const editorMarginsState =
      toggleState !== undefined ? toggleState : !editorMargins;
    this.set({ editorMargins: editorMarginsState });
    Config.set("editor:margins", editorMarginsState);
  };

  getActiveTab = () => {
    const activeTabId = this.get().activeTabId;
    return this.get().tabs.find((t) => t.id === activeTabId);
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

  addTab = (sessionId?: string) => {
    const id = getId();
    const newSessionId = sessionId || tabSessionHistory.add(id);
    this.set((state) => {
      state.tabs.push({
        id,
        sessionId: newSessionId
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

  focusTab = (tabId: string | undefined, sessionId?: string) => {
    if (!tabId) return;

    const { history } = this.get();
    if (history.includes(tabId)) history.splice(history.indexOf(tabId), 1);
    history.push(tabId);

    this.set({
      activeTabId: tabId,
      canGoBack: tabSessionHistory.canGoBack(tabId),
      canGoForward: tabSessionHistory.canGoForward(tabId)
    });

    sessionId =
      sessionId || this.get().tabs.find((t) => t.id === tabId)?.sessionId;
    if (sessionId) this.rehydrateSession(sessionId);
  };
}

const useEditorStore = createPersistedStore(EditorStore, {
  name: "editor-sessions-v2",
  partialize: (state) => ({
    history: state.history,
    arePropertiesVisible: state.arePropertiesVisible,
    editorMargins: state.editorMargins,
    tabs: state.tabs,
    activeTabId: state.activeTabId,
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
  storage: db.config() as PersistStorage<Partial<EditorStore>>
});
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

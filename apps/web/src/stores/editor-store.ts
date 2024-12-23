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
import { Context } from "../components/list-container/types";
import { showToast } from "../utils/toast";
import { getId } from "@notesnook/core";
import { PersistStorage } from "zustand/middleware";
import { getFormattedHistorySessionDate } from "@notesnook/common";
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

// type ConflictedContentItem = Omit<ContentItem, "conflicted"> & {
//   conflicted: ContentItem;
// };

export type BaseEditorSession = {
  id: string;
  needsHydration?: boolean;
  pinned?: boolean;
  preview?: boolean;
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
  context?: Context;
  saveState: SaveState;
  content?: NoteContent<false>;
};

export type ConflictedEditorSession = BaseEditorSession & {
  type: "conflicted" | "diff";
  note: Note;
  content?: ContentItem;
};

export type EditorSession =
  | DefaultEditorSession
  | LockedEditorSession
  | NewEditorSession
  | ConflictedEditorSession
  | ReadonlyEditorSession
  | DeletedEditorSession;

export type SessionType = keyof SessionTypeMap;
type SessionTypeMap = {
  default: DefaultEditorSession;
  locked: LockedEditorSession;
  new: NewEditorSession;
  conflicted: ConflictedEditorSession;
  diff: ConflictedEditorSession;
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
const saveMutex = new Mutex();
class EditorStore extends BaseStore<EditorStore> {
  sessions: EditorSession[] = [];
  activeSessionId?: string;

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

  getActiveSession = <T extends SessionType[]>(types?: T) => {
    const { activeSessionId, sessions } = this.get();
    return sessions.find(
      (s): s is SessionTypeMap[T[number]] =>
        s.id === activeSessionId && (!types || types.includes(s.type))
    );
  };

  init = () => {
    EV.subscribe(EVENTS.userLoggedOut, () => {
      const { closeSessions, sessions } = this.get();
      closeSessions(...sessions.map((s) => s.id));
    });

    EV.subscribe(EVENTS.vaultLocked, () => {
      this.set((state) => {
        state.sessions = state.sessions.map((session) => {
          if (isLockedSession(session)) {
            if (
              session.type === "diff" ||
              session.type === "deleted" ||
              // TODO: what's this?
              !("note" in session)
            )
              return session;

            return <LockedEditorSession>{
              type: "locked",
              id: session.id,
              note: session.note,
              pinned: session.pinned,
              preview: session.preview
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
        const { sessions, closeSessions, updateSession, openSession } =
          this.get();
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
          if (noteId && session.id !== noteId && session.note.id !== noteId)
            continue;
          if (isDeleted(item) || isTrashItem(item)) clearIds.push(session.id);
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
        if (clearIds.length > 0) closeSessions(...clearIds);
      }
    );

    db.eventManager.subscribe(
      EVENTS.databaseUpdated,
      async (event: DatabaseUpdatedEvent) => {
        const { sessions, openSession, closeSessions, updateSession } =
          this.get();
        const clearIds: string[] = [];
        if (event.collection === "notes") {
          // when a note is permanently deleted from trash
          if (event.type === "softDelete" || event.type === "delete") {
            clearIds.push(
              ...event.ids.filter(
                (id) =>
                  sessions.findIndex(
                    (s) => s.id === id || ("note" in s && s.note.id === id)
                  ) > -1
              )
            );
          } else if (event.type === "update") {
            for (const session of sessions) {
              if (
                session.type === "new" ||
                (!event.ids.includes(session.id) &&
                  !event.ids.includes(session.note.id))
              )
                continue;

              if (
                // when a note's readonly property is toggled
                (session.type !== "readonly" && !!event.item.readonly) ||
                (session.type === "readonly" && !event.item.readonly) ||
                // when a note is restored from trash
                (session.type === "deleted" && event.item.type !== "trash")
              ) {
                openSession(session.id, { force: true, silent: true });
              } else if (
                // when a note is moved to trash
                session.type !== "deleted" &&
                event.item.type === "trash"
              ) {
                clearIds.push(session.id);
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
                openSession(session.id, { force: true, silent: true });
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
                !ids.includes(session.id) &&
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
                !ids.includes(session.id) &&
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
              console.log("UDPATE");
              updateSession(session.id, undefined, {
                tags: await db.notes.tags(session.note.id)
              });
            }
          }
        }
        if (clearIds.length > 0) closeSessions(...clearIds);
      }
    );

    const {
      openSession,
      openDiffSession,
      activateSession,
      activeSessionId,
      getSession,
      newSession
    } = this.get();
    if (activeSessionId) {
      const session = getSession(activeSessionId);
      if (!session) return;

      if (session.type === "diff" || session.type === "conflicted")
        openDiffSession(session.note.id, session.id);
      else if (session.type === "new") activateSession(session.id);
      else openSession(activeSessionId);
    } else newSession();
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

  activateSession = (id?: string, activeBlockId?: string) => {
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

    this.set({ activeSessionId: id });
    appStore.setIsEditorOpen(!!id);

    if (id) {
      const { history } = this.get();
      if (history.includes(id)) history.splice(history.indexOf(id), 1);
      history.push(id);
      if (session?.type === "new")
        hashNavigate(`/notes/${id}/create`, { replace: true, notify: false });
      else hashNavigate(`/notes/${id}/edit`, { replace: true, notify: false });
    }

    if (activeBlockId && session)
      this.updateSession(session.id, [session.type], {
        activeBlockId
      });

    if (session)
      AppEventManager.publish(
        AppEvents.revealItemInList,
        "note" in session ? session.note.id : session.id
      );
  };

  openDiffSession = async (noteId: string, sessionId: string) => {
    const session = await db.noteHistory.session(sessionId);
    const note = await db.notes.note(noteId);
    if (!session || !note || !note.contentId) return;

    const currentContent = await db.content.get(note.contentId);
    const oldContent = await db.noteHistory.content(session.id);

    if (!oldContent || !currentContent) return;

    const label = getFormattedHistorySessionDate(session);
    this.get().addSession({
      type: "diff",
      id: session.id,
      note,
      title: label,
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
      newSession?: boolean;
    } = {}
  ): Promise<void> => {
    const { getSession, openDiffSession } = this.get();
    const noteId = typeof noteOrId === "string" ? noteOrId : noteOrId.id;
    const session = getSession(noteId);

    if (session && !options.force) {
      if (!session.needsHydration) {
        return this.activateSession(noteId, options.activeBlockId);
      }

      if (session.type === "diff" || session.type === "conflicted") {
        return openDiffSession(session.note.id, session.id);
      }
    }

    if (session && session.id) await db.fs().cancel(session.id);

    const note =
      typeof noteOrId === "object"
        ? noteOrId
        : (await db.notes.note(noteId)) || (await db.notes.trashed(noteId));
    if (!note) return;
    const isPreview = session ? session.preview : !options?.newSession;
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
          id: note.id,
          pinned: session?.pinned,
          note,
          preview: isPreview,
          activeBlockId: options.activeBlockId
        },
        !options.silent
      );
    } else if (isLocked && note.type !== "trash") {
      this.addSession(
        {
          type: "locked",
          id: note.id,
          pinned: session?.pinned,
          note,
          preview: isPreview,
          activeBlockId: options.activeBlockId
        },
        !options.silent
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
            id: note.id,
            pinned: session?.pinned,
            content,
            activeBlockId: options.activeBlockId
          },
          !options.silent
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
              id: note.id,
              pinned: session?.pinned,
              content,
              color: colors[0]?.fromId,
              tags,
              activeBlockId: options.activeBlockId
            },
            !options.silent
          );
        } else {
          this.addSession(
            {
              type: "default",
              id: note.id,
              note,
              saveState: SaveState.Saved,
              sessionId: `${Date.now()}`,
              attachmentsLength,
              pinned: session?.pinned,
              tags,
              color: colors[0]?.fromId,
              content,
              preview: isPreview,
              activeBlockId: options.activeBlockId
            },
            !options.silent
          );
        }
      }
    }
  };

  addSession = (session: EditorSession, activate = true) => {
    let oldSessionId: string | null = null;

    this.set((state) => {
      const { activeSessionIndex, duplicateSessionIndex, previewSessionIndex } =
        findSessionIndices(state.sessions, session, state.activeSessionId);

      if (duplicateSessionIndex > -1) {
        oldSessionId = state.sessions[duplicateSessionIndex].id;
        state.sessions[duplicateSessionIndex] = session;
      } else if (previewSessionIndex > -1) {
        oldSessionId = state.sessions[previewSessionIndex].id;
        state.sessions[previewSessionIndex] = session;
      } else if (activeSessionIndex > -1)
        state.sessions.splice(activeSessionIndex + 1, 0, session);
      else state.sessions.push(session);
      state.sessions.sort((a, b) =>
        a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1
      );
    });

    const { history } = this.get();
    if (
      oldSessionId &&
      oldSessionId !== session.id &&
      history.includes(oldSessionId)
    )
      history.splice(history.indexOf(oldSessionId), 1);

    if (activate) this.activateSession(session.id);
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

        if (isLockedSession(currentSession) && partial.content) {
          logger.debug("Saving locked content", { id });

          await db.vault.save({
            content: partial.content,
            sessionId,
            id
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
            id
          });
        }

        const note = await db.notes.note(id);
        if (!note) throw new Error("Note not saved.");

        if (currentSession.type === "new") {
          if (currentSession.context) {
            const { type } = currentSession.context;
            if (type === "notebook")
              await db.notes.addToNotebook(currentSession.context.id, id);
            else if (type === "color" || type === "tag")
              await db.relations.add(
                { type, id: currentSession.context.id },
                { id, type: "note" }
              );
          } else {
            const defaultNotebook = db.settings.getDefaultNotebook();
            if (defaultNotebook)
              await db.notes.addToNotebook(defaultNotebook, id);
          }
        }

        const attachmentsLength = await db.attachments
          .ofNote(id, "all")
          .count();
        const shouldRefreshNotes =
          currentSession.type === "new" ||
          !id ||
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
            preview: false,
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
        if (isLockedSession(currentSession)) {
          this.get().openSession(id, { force: true });
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
    const state = useEditorStore.getState();
    const session = state.sessions.find((session) => session.type === "new");
    if (session) {
      session.context = useNoteStore.getState().context;
      this.activateSession(session.id);
    } else {
      this.addSession({
        type: "new",
        id: getId(),
        context: useNoteStore.getState().context,
        saveState: SaveState.NotSaved
      });
    }
  };

  closeSessions = (...ids: string[]) => {
    this.set((state) => {
      const sessions: EditorSession[] = [];
      for (let i = 0; i < state.sessions.length; ++i) {
        const session = state.sessions[i];
        if (!ids.includes(session.id)) {
          sessions.push(session);
          continue;
        }

        this.saveSessionContentIfNotSaved(session.id);

        db.fs().cancel(session.id).catch(console.error);
        if (state.history.includes(session.id))
          state.history.splice(state.history.indexOf(session.id), 1);
      }
      state.sessions = sessions;
    });

    const { history, sessions } = this.get();
    this.activateSession(history.pop());
    if (sessions.length === 0) this.newSession();
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
}

const useEditorStore = createPersistedStore(EditorStore, {
  name: "editor-sessions",
  partialize: (state) => ({
    history: state.history,
    activeSessionId: state.activeSessionId,
    arePropertiesVisible: state.arePropertiesVisible,
    editorMargins: state.editorMargins,
    sessions: state.sessions.reduce((sessions, session) => {
      sessions.push({
        id: session.id,
        type: isLockedSession(session) ? "locked" : session.type,
        needsHydration: session.type === "new" ? false : true,
        preview: session.preview,
        pinned: session.pinned,
        title: session.title,
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

function findSessionIndices(
  sessions: EditorSession[],
  session: EditorSession,
  activeSessionId?: string
) {
  let activeSessionIndex = -1;
  let previewSessionIndex = -1;
  let duplicateSessionIndex = -1;
  for (let i = 0; i < sessions.length; ++i) {
    const { id, preview } = sessions[i];
    if (id === session.id) duplicateSessionIndex = i;
    else if (preview && session.preview) previewSessionIndex = i;
    else if (id === activeSessionId) activeSessionIndex = i;
  }

  return {
    activeSessionIndex,
    previewSessionIndex,
    duplicateSessionIndex
  };
}

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

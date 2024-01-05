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
import { EV, EVENTS } from "@notesnook/core/dist/common";
import { logger } from "../utils/logger";
import Config from "../utils/config";
import { setDocumentTitle } from "../utils/dom";
import { BaseTrashItem, ContentItem, Note, Tag } from "@notesnook/core";
import { NoteContent } from "@notesnook/core/dist/collections/session-content";
import { Context } from "../components/list-container/types";
import { getId } from "@notesnook/core/dist/utils/id";
import { createJSONStorage } from "zustand/middleware";
import { getFormattedHistorySessionDate } from "@notesnook/common";
import { isCipher } from "@notesnook/core/dist/database/crypto";

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
  attachmentsLength?: number;
  saveState: SaveState;
};

export type NewEditorSession = BaseEditorSession & {
  type: "new";
  context?: Context;
  saveState: SaveState;
};

export type ConflictedEditorSession = BaseEditorSession & {
  type: "conflicted" | "diff";
  note: Note;
  content: ContentItem;
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
  unlocked: DefaultEditorSession;
  default: DefaultEditorSession;
  locked: LockedEditorSession;
  new: NewEditorSession;
  conflicted: ConflictedEditorSession;
  diff: ConflictedEditorSession;
  readonly: ReadonlyEditorSession;
  deleted: DeletedEditorSession;
};

export function isLockedSession(
  session: EditorSession
): session is
  | LockedEditorSession
  | DefaultEditorSession
  | DeletedEditorSession
  | ConflictedEditorSession {
  return (
    session.type === "locked" || ("note" in session && session.note.locked)
  );
}

class EditorStore extends BaseStore<EditorStore> {
  sessions: EditorSession[] = [];
  activeSessionId?: string;

  arePropertiesVisible = false;
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
          console.log("REFRESHIGN", session);
          if (isLockedSession(session)) {
            if (session.type === "diff" || session.type === "deleted")
              return session;

            return {
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

    const {
      openSession,
      openDiffSession,
      activateSession,
      activeSessionId,
      getSession
    } = this.get();
    if (activeSessionId) {
      const session = getSession(activeSessionId);
      if (!session) return;

      console.log("OPENING", session);
      if (session.type === "diff") openDiffSession(session.note.id, session.id);
      else if (session.type === "new") activateSession(session.id);
      else openSession(activeSessionId);
    }
  };

  refreshTags = async () => {
    // const { session } = this.get();
    // if (!session.id) return;
    // this.set({
    //   tags: await db.relations
    //     .to({ id: session.id, type: "note" }, "tag")
    //     .selector.items(undefined, {
    //       sortBy: "dateCreated",
    //       sortDirection: "asc"
    //     })
    // });
  };

  async refresh() {
    // const sessionId = this.get().session.id;
    // if (sessionId && !(await db.notes.exists(sessionId)))
    //   await this.clearSession();
  }

  updateSession = <T extends SessionType[]>(
    id: string,
    types: T,
    partial:
      | Partial<SessionTypeMap[T[number]]>
      | ((session: SessionTypeMap[T[number]]) => void)
  ) => {
    this.set((state) => {
      const index = state.sessions.findIndex(
        (s) => s.id === id && types.includes(s.type)
      );
      if (index === -1) return;
      const session = state.sessions[index] as SessionTypeMap[T[number]];
      if (typeof partial === "function") partial(session);
      else state.sessions[index] = { ...session, ...partial };
    });
  };

  activateSession = (id?: string) => {
    const session = this.get().sessions.find((s) => s.id === id);
    if (!session) id = undefined;

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
    this.toggleProperties(false);

    if (id) {
      const { history } = this.get();
      if (history.includes(id)) history.splice(history.indexOf(id), 1);
      history.push(id);
    }
  };

  openDiffSession = async (noteId: string, sessionId: string) => {
    const session = await db.noteHistory.session(sessionId);
    const note = await db.notes.note(noteId);
    if (!session || !note || !note.contentId) return;

    const currentContent = await db.content.get(note.contentId);
    const oldContent = await db.noteHistory.content(session.id);

    if (!oldContent || !currentContent) return;

    const label = getFormattedHistorySessionDate(session);
    useEditorStore.getState().addSession({
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
    force = false
  ): Promise<void> => {
    const { getSession } = this.get();
    const noteId = typeof noteOrId === "string" ? noteOrId : noteOrId.id;
    const session = getSession(noteId);

    if (session && !force && !session.needsHydration) {
      return this.activateSession(noteId);
    }

    if (session && session.id) await db.fs().cancel(session.id, "download");

    const note =
      typeof noteOrId === "object"
        ? noteOrId
        : (await db.notes.note(noteId)) || (await db.notes.trashed(noteId));
    if (!note) return;
    const isPreview = session ? session.preview : true;

    if (note.locked && note.type !== "trash") {
      this.addSession({
        type: "locked",
        id: note.id,
        note,
        preview: isPreview
      });
    } else if (note.conflicted) {
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
        return this.openSession(note, true);
      }

      this.addSession({
        type: "conflicted",
        content: content,
        id: note.id,
        note,
        preview: isPreview
      });
    } else {
      const content = note.contentId
        ? await db.content.get(note.contentId)
        : undefined;

      if (content?.locked) {
        note.locked = true;
        await db.notes.add({ id: note.id, locked: true });
        return this.openSession(note, true);
      }

      if (note.type === "trash") {
        this.addSession({
          type: "deleted",
          note,
          id: note.id,
          content
        });
      } else if (note.readonly) {
        this.addSession({
          type: "readonly",
          note,
          id: note.id,
          content
        });
      } else {
        const attachmentsLength = await db.attachments
          .ofNote(note.id, "all")
          .count();

        this.addSession({
          type: "default",
          id: note.id,
          note,
          saveState: SaveState.Saved,
          sessionId: `${Date.now()}`,
          attachmentsLength,
          content,
          preview: isPreview
        });
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
    }
  ) => {
    const currentSession = this.getSession(id, ["new", "default"]);
    if (!currentSession) return;

    // do not allow saving of readonly session
    if (partial.note?.readonly) return;
    if (
      currentSession.saveState === SaveState.Saving ||
      currentSession.id !== id
    )
      return;

    this.setSaveState(id, 0);
    try {
      //   if (partial.content) currentSession.content = partial.content;
      if (isLockedSession(currentSession)) {
        await db.vault.save({
          ...partial.note,
          content: partial.content,
          sessionId: partial.sessionId,
          id
        });
      } else {
        await db.notes.add({
          ...partial.note,
          content: partial.content,
          sessionId: partial.sessionId,
          id
        });
      }

      // if (currentSession && currentSession.id !== id) {
      //   noteStore.refresh();
      //   throw new Error("Aborting save operation: old session.");
      // }
      // if (!id) throw new Error("Note not saved.");

      // let note = await db.notes.note(id);
      // if (!note) throw new Error("Note not saved.");

      // hashNavigate(`/notes/${id}/edit`, { replace: true, notify: false });

      const defaultNotebook = db.settings.getDefaultNotebook();
      if (currentSession.type === "new" && currentSession.context) {
        const { type } = currentSession.context;
        if (type === "notebook")
          await db.notes.addToNotebook(currentSession.context.id, id);
        else if (type === "color" || type === "tag")
          await db.relations.add(
            { type, id: currentSession.context.id },
            { id, type: "note" }
          );
      } else if (!id && defaultNotebook) {
        await db.notes.addToNotebook(defaultNotebook, id);
      }

      const note = await db.notes.note(id);
      if (!note) throw new Error("Note not saved.");

      const attachmentsLength = await db.attachments.ofNote(id, "all").count();
      const shouldRefreshNotes =
        currentSession.type === "new" ||
        !id ||
        note.title !== currentSession.note?.title ||
        note.headline !== currentSession.note?.headline ||
        attachmentsLength !== currentSession.attachmentsLength;
      if (shouldRefreshNotes) useNoteStore.getState().refresh();

      if (currentSession.type === "new") {
        this.addSession({
          type: "default",
          id,
          note,
          saveState: SaveState.Saved,
          sessionId: partial.sessionId || `${Date.now()}`,
          attachmentsLength,
          pinned: currentSession.pinned,
          content: partial.content
        });
      } else {
        this.updateSession(id, ["unlocked", "default"], {
          preview: false,
          attachmentsLength: attachmentsLength,
          note
        });
      }

      setDocumentTitle(
        settingStore.get().hideNoteTitle ? undefined : note.title
      );
    } catch (err) {
      this.setSaveState(id, -1);
      console.error(err);
      if (err instanceof Error) logger.error(err);
      if (isLockedSession(currentSession)) {
        // TODO:
        // hashNavigate(`/notes/${id}/unlock`, { replace: true });
      }
    }
  };

  newSession = () => {
    this.addSession({
      type: "new",
      id: getId(),
      context: useNoteStore.getState().context,
      saveState: SaveState.NotSaved
    });
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

        db.fs().cancel(session.id, "download").catch(console.error);
        if (state.history.includes(session.id))
          state.history.splice(state.history.indexOf(session.id), 1);
      }
      state.sessions = sessions;
    });

    const { history } = this.get();
    this.activateSession(history.pop());
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
    sessionId: string,
    content: NoteContent<false>
  ) => {
    return this.saveSession(id, { sessionId, content });
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

  toggleEditorMargins = (toggleState?: boolean) => {
    this.set((state) => {
      state.editorMargins =
        toggleState !== undefined ? toggleState : !state.editorMargins;
      Config.set("editor:margins", state.editorMargins);
    });
  };
}

const [useEditorStore] = createPersistedStore(EditorStore, {
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
        needsHydration: true,
        preview: session.preview,
        pinned: session.pinned,
        note:
          "note" in session
            ? {
                title: session.note.title
              }
            : undefined
      } as EditorSession);

      return sessions;
    }, [] as EditorSession[])
  }),
  storage: createJSONStorage(() => localStorage)
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

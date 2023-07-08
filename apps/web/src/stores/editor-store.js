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

import createStore from "../common/store";
import { store as noteStore } from "./note-store";
import { store as attachmentStore } from "./attachment-store";
import { store as appStore } from "./app-store";
import { store as tagStore } from "./tag-store";
import { db } from "../common/db";
import BaseStore from ".";
import { EV, EVENTS } from "@notesnook/core/common";
import { hashNavigate } from "../navigation";
import { logger } from "../utils/logger";
import Config from "../utils/config";
import { setDocumentTitle } from "../utils/dom";

const SESSION_STATES = {
  stale: "stale",
  new: "new",
  locked: "locked",
  unlocked: "unlocked",
  opening: "opening"
};

export const getDefaultSession = (sessionId = Date.now()) => {
  return {
    sessionType: "default",
    readonly: false,
    state: undefined,
    saveState: 1, // -1 = not saved, 0 = saving, 1 = saved
    sessionId,
    /**
     * @type {string  | undefined}
     */
    contentId: undefined,
    /**
     * @type {any[]}
     */
    notebooks: undefined,
    title: "",
    /**
     * @type {string | undefined}
     */
    id: undefined,
    pinned: false,
    localOnly: false,
    favorite: false,
    locked: false,
    tags: [],
    context: undefined,
    color: undefined,
    dateEdited: 0,
    attachmentsLength: 0,
    isDeleted: false,

    /**
     * @type {{data: string; type: "tiptap"} | undefined}
     */
    content: undefined
  };
};

/**
 * @extends {BaseStore<EditorStore>}
 */
class EditorStore extends BaseStore {
  session = getDefaultSession();
  arePropertiesVisible = false;
  editorMargins = Config.get("editor:margins", true);

  init = () => {
    EV.subscribe(EVENTS.userLoggedOut, () => {
      hashNavigate("/notes/create", { replace: true, addNonce: true });
    });

    EV.subscribe(EVENTS.vaultLocked, () => {
      const { id, locked } = this.get().session;
      if (locked) hashNavigate(`/notes/${id}/unlock`, { replace: true });
    });
  };

  refreshTags = () => {
    this.set((state) => {
      state.session.tags = state.session.tags.slice();
    });
  };

  async refresh() {
    const sessionId = this.get().session.id;
    if (sessionId && !db.notes.note(sessionId)) await this.clearSession();
  }

  updateSession = async (item) => {
    this.set((state) => {
      state.session.title = item.title;
      state.session.tags = item.tags;
      state.session.pinned = item.pinned;
      state.session.favorite = item.favorite;
      state.session.readonly = item.readonly;
      state.session.dateEdited = item.dateEdited;
      state.session.dateCreated = item.dateCreated;
      state.session.locked = item.locked;
    });
  };

  openLockedSession = async (note) => {
    this.set((state) => {
      state.session = {
        ...getDefaultSession(note.dateEdited),
        ...note,
        sessionType: "locked",
        id: undefined, // NOTE: we give a session id only after the note is opened.
        state: SESSION_STATES.unlocked
      };
    });
    appStore.setIsEditorOpen(true);
    hashNavigate(`/notes/${note.id}/edit`, { replace: true });
  };

  openSession = async (noteId, force) => {
    const session = this.get().session;

    if (session.id) await db.fs.cancel(session.id);
    if (session.id === noteId && !force) return;

    if (session.state === SESSION_STATES.unlocked) {
      this.set((state) => {
        state.session.id = noteId;
        state.session.state = SESSION_STATES.new;
      });
      return;
    }

    const note = db.notes.note(noteId)?.data || db.notes.trashed(noteId);
    if (!note) return;

    noteStore.setSelectedNote(note.id);
    setDocumentTitle(note.title);

    if (note.locked)
      return hashNavigate(`/notes/${noteId}/unlock`, { replace: true });
    if (note.conflicted)
      return hashNavigate(`/notes/${noteId}/conflict`, { replace: true });

    const content = await db.content.raw(note.contentId);
    this.set((state) => {
      const defaultSession = getDefaultSession(note.dateEdited);
      state.session = {
        ...defaultSession,
        ...note,
        content,
        state: SESSION_STATES.new,
        attachmentsLength: db.attachments.ofNote(note.id, "all")?.length || 0
      };

      const isDeleted = note.type === "trash";
      if (isDeleted) {
        state.session.isDeleted = true;
        state.session.readonly = true;
      }
    });
    appStore.setIsEditorOpen(true);
    this.toggleProperties(false);
  };

  saveSession = async (sessionId, session) => {
    if (!session) {
      logger.warn("Session cannot be undefined", { sessionId, session });
      return;
    }

    const currentSession = this.get().session;
    if (currentSession.readonly && session.readonly !== false) return; // do not allow saving of readonly session
    if (currentSession.saveState === 0 || currentSession.id !== sessionId)
      return;

    this.setSaveState(0);
    try {
      if (session.content) this.get().session.content = session.content;

      const id = await this._getSaveFn()({ ...session, id: sessionId });
      if (currentSession && currentSession.id !== sessionId) {
        noteStore.refresh();
        throw new Error("Aborting save operation: old session.");
      }

      let note = db.notes.note(id)?.data;
      if (!note) throw new Error("Note not saved.");

      if (!sessionId) {
        noteStore.setSelectedNote(id);
        hashNavigate(`/notes/${id}/edit`, { replace: true, notify: false });
      }

      if (currentSession.context) {
        const { type, value } = currentSession.context;
        if (type === "topic" || type === "notebook")
          await db.notes.addToNotebook(value, id);
        else if (type === "color") await db.notes.note(id).color(value);
        else if (type === "tag") await db.notes.note(id).tag(value);
        // update the note.
        note = db.notes.note(id)?.data;
      } else if (!sessionId && db.settings.getDefaultNotebook()) {
        await db.notes.addToNotebook(db.settings.getDefaultNotebook(), id);
      }

      const shouldRefreshNotes =
        currentSession.context ||
        !sessionId ||
        note.title !== currentSession.title ||
        note.headline !== currentSession.headline;
      if (shouldRefreshNotes) noteStore.refresh();

      const attachments = db.attachments.ofNote(id, "all");
      if (attachments.length !== currentSession.attachmentsLength) {
        attachmentStore.refresh();
      }

      this.set((state) => {
        if (!!state.session.id && state.session.id !== note.id) return;

        for (let key in session) {
          if (key === "content") continue;
          state.session[key] = session[key];
        }

        state.session.notebooks = note.notebooks;
        state.session.context = null;
        state.session.id = note.id;
        state.session.title = note.title;
        state.session.dateEdited = note.dateEdited;
        state.session.attachmentsLength = attachments.length;
      });
      setDocumentTitle(note.title);

      this.setSaveState(1);
    } catch (err) {
      this.setSaveState(-1);
      logger.error(err);
      if (currentSession.locked) {
        hashNavigate(`/notes/${session.id}/unlock`, { replace: true });
      }
    }
  };

  newSession = async (nonce) => {
    let context = noteStore.get().context;
    const session = this.get().session;
    if (session.id) await db.fs.cancel(session.id);

    this.set((state) => {
      state.session = {
        ...getDefaultSession(),
        context,
        nonce,
        state: SESSION_STATES.new
      };
    });
    noteStore.setSelectedNote(0);
    appStore.setIsEditorOpen(true);
    setDocumentTitle();
  };

  clearSession = async (shouldNavigate = true) => {
    const session = this.get().session;
    if (session.id) await db.fs.cancel(session.id);

    this.set((state) => {
      state.session = {
        ...getDefaultSession(),
        state: SESSION_STATES.new
      };
    });
    noteStore.setSelectedNote(0);
    this.toggleProperties(false);
    if (shouldNavigate)
      hashNavigate(`/notes/create`, { replace: true, addNonce: true });
    setTimeout(() => appStore.setIsEditorOpen(false), 100);
    setDocumentTitle();
  };

  setTitle = (noteId, title) => {
    return this.saveSession(noteId, { title });
  };

  toggle = (noteId, name, value) => {
    return this.saveSession(noteId, { [name]: value });
  };

  saveSessionContent = (noteId, sessionId, content) => {
    return this.saveSession(noteId, { sessionId, content });
  };

  setTag = (tag) => {
    return this._setTag(tag);
  };

  setSaveState = (saveState) => {
    this.set((state) => {
      state.session.saveState = saveState;
    });
  };

  toggleProperties = (toggleState) => {
    this.set(
      (state) =>
        (state.arePropertiesVisible =
          toggleState !== undefined ? toggleState : !state.arePropertiesVisible)
    );
  };

  toggleEditorMargins = (toggleState) => {
    this.set((state) => {
      state.editorMargins =
        toggleState !== undefined ? toggleState : !state.editorMargins;
      Config.set("editor:margins", state.editorMargins);
    });
  };

  /**
   * @private internal
   * @param {Boolean} isLocked
   * @returns {(note: any) => Promise<string>}
   */
  _getSaveFn = () => {
    return this.get().session.locked
      ? db.vault.save.bind(db.vault)
      : db.notes.add.bind(db.notes);
  };

  async _setTag(value) {
    value = db.tags.sanitize(value);
    if (!value) return;
    const { tags, id } = this.get().session;

    let note = db.notes.note(id);
    if (!note) return;

    let index = tags.indexOf(value);

    if (index > -1) {
      await note.untag(value);
      appStore.refreshNavItems();
    } else {
      await note.tag(value);
    }

    this.set((state) => {
      state.session.tags = db.notes.note(id).tags.slice();
    });

    tagStore.refresh();
    noteStore.refresh();
  }
}

const [useStore, store] = createStore(EditorStore);
export { useStore, store, SESSION_STATES };

import createStore from "../common/store";
import { store as noteStore } from "./note-store";
import { store as appStore } from "./app-store";
import { store as tagStore } from "./tag-store";
import { db } from "../common/db";
import BaseStore from ".";
import { EV, EVENTS } from "notes-core/common";
import { hashNavigate } from "../navigation";
import { qclone } from "qclone";

const SESSION_STATES = {
  stale: "stale",
  new: "new",
  locked: "locked",
  unlocked: "unlocked",
  opening: "opening",
};

const getDefaultSession = (sessionId = Date.now()) => {
  return {
    readonly: false,
    sessionId,
    contentId: undefined,
    notebooks: undefined,
    state: undefined,
    isSaving: false,
    title: "",
    id: undefined,
    pinned: false,
    favorite: false,
    locked: false,
    tags: [],
    context: undefined,
    color: undefined,
    dateEdited: 0,
    attachments: [],
    content: {
      type: "tiny",
      data: "",
    },
  };
};
class EditorStore extends BaseStore {
  session = getDefaultSession();
  arePropertiesVisible = false;

  init = () => {
    EV.subscribe(EVENTS.userLoggedOut, () => {
      hashNavigate("/notes/create", { replace: true, addNonce: true });
    });
  };

  refresh = async () => {
    const { id } = this.get().session;
    await this.openSession(id, true);
  };

  refreshTags = () => {
    this.set((state) => {
      state.session.tags = state.session.tags.slice();
    });
  };

  openLockedSession = async (note) => {
    this.set((state) => {
      state.session = {
        ...getDefaultSession(note.dateEdited),
        ...note,
        id: undefined, // NOTE: we give a session id only after the note is opened.
        content: note.content,
        state: SESSION_STATES.unlocked,
      };
    });
    appStore.setIsEditorOpen(true);
    hashNavigate(`/notes/${note.id}/edit`, { replace: true });
  };

  openPreviewSession = (session) => {
    const { content, dateCreated, dateEdited } = session;
    this.set((state) => {
      state.session.oldContent = state.session.content;
      state.session.oldDateCreated = state.session.dateCreated;
      state.session.oldDateEdited = state.session.dateEdited;
      state.session.oldSessionId = state.session.sessionId;

      state.session.content = content;
      state.session.sessionId = undefined;
      state.session.dateCreated = dateCreated;
      state.session.dateEdited = dateEdited;
      state.session.readonly = true;
      state.session.state = SESSION_STATES.new;
    });
  };

  closePreviewSession = (newSession) => {
    this.set((state) => {
      state.session.content = newSession.content;
      state.session.sessionId = newSession.sessionId;
      state.session.dateCreated = newSession.dateCreated;
      state.session.dateEdited = newSession.dateEdited;
      state.session.readonly = false;
      state.session.state = SESSION_STATES.stale;

      delete state.session.oldContent;
      delete state.session.oldDateCreated;
      delete state.session.oldDateEdited;
      delete state.session.oldSessionId;
    });
  };

  openSession = async (noteId, force) => {
    await db.notes.init();

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

    let note = db.notes.note(noteId);
    if (!note) return;
    note = note.data;

    noteStore.setSelectedNote(note.id);

    if (note.locked)
      return hashNavigate(`/notes/${noteId}/unlock`, { replace: true });
    if (note.conflicted)
      return hashNavigate(`/notes/${noteId}/conflict`, { replace: true });

    let content = await db.content.raw(note.contentId, false);

    this.set((state) => {
      const defaultSession = getDefaultSession(note.dateEdited);
      state.session = {
        ...defaultSession,
        ...note,
        content: content || defaultSession.content,
        state: SESSION_STATES.new,
        attachments: db.attachments.ofNote(note.id, "all") || [],
      };
    });
    appStore.setIsEditorOpen(true);
  };

  saveSession = (oldSession) => {
    const session = this.get().session;
    if (session.isSaving) return; // avoid multiple in-queue saves; only save one time.
    if (session.state === SESSION_STATES.preview) return; // do not allow saving of preview-only content

    this.set((state) => (state.session.isSaving = true));
    return this._saveFn()(session)
      .then(async (id) => {
        let note = db.notes.note(id)?.data;
        if (!note) {
          this.set((state) => (state.session.isSaving = false));
          return;
        }
        /* eslint-disable */
        storeSync: {
          if (oldSession?.tags?.length !== session.tags.length)
            tagStore.refresh();

          if (oldSession?.color !== session.color) appStore.refreshNavItems();

          if (!oldSession?.context) break storeSync;

          const { type, value } = oldSession.context;
          if (type === "topic") await db.notes.move(value, id);
          else if (type === "color") await db.notes.note(id).color(value);
          else if (type === "tag") await db.notes.note(id).tag(value);

          // update the note.
          note = db.notes.note(id)?.data;
        }
        /* eslint-enable */

        if (!this.get().session.id) {
          noteStore.setSelectedNote(id);
        }

        const attachments = db.attachments.ofNote(note.id, "all");
        this.set((state) => {
          state.session.id = note.id;
          state.session.isSaving = false;
          state.session.notebooks = note.notebooks;
          state.session.attachments = attachments;
        });

        if (!oldSession) {
          noteStore.refresh();
          return;
        }

        if (
          attachments?.length !== oldSession.attachments.length ||
          note.headline !== oldSession.headline ||
          note.title !== oldSession.title
        )
          noteStore.refresh();

        if (!oldSession.id) {
          hashNavigate(`/notes/${id}/edit`, { replace: true });
        }
      })
      .catch((err) => {
        console.error(err);
        if (session.locked) {
          hashNavigate(`/notes/${session.id}/unlock`, { replace: true });
        }
      });
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
        state: SESSION_STATES.new,
      };
    });
    noteStore.setSelectedNote(0);
    appStore.setIsEditorOpen(true);
  };

  clearSession = async (shouldNavigate = true) => {
    const session = this.get().session;
    if (session.id) await db.fs.cancel(session.id);

    appStore.setIsEditorOpen(false);
    this.set((state) => {
      state.session = {
        ...getDefaultSession(),
        state: SESSION_STATES.new,
      };
    });
    noteStore.setSelectedNote(0);
    this.toggleProperties(false);
    if (shouldNavigate) hashNavigate(`/`, { replace: true });
  };

  setSession = (set) => {
    const oldSession = qclone(this.get().session);
    this.set(set);
    return this.saveSession(oldSession);
  };

  setSessionContent = (content) => {
    const oldSession = qclone(this.get().session);
    this.get().session.content = content;
    return this.saveSession(oldSession);
  };

  toggleLocked = () => {
    if (this.get().session.locked) noteStore.unlock(this.get().session.id);
    else noteStore.lock(this.get().session.id);
  };

  setColor = (color) => {
    //this._setTagOrColor("color", color);
    return noteStore.setColor(this.get().session.id, color);
  };

  setTag = (tag) => {
    return this._setTag(tag);
  };

  toggleProperties = (toggleState) => {
    this.set(
      (state) =>
        (state.arePropertiesVisible =
          toggleState !== undefined ? toggleState : !state.arePropertiesVisible)
    );
  };

  /**
   * @private internal
   * @param {Boolean} isLocked
   * @returns {(note: any) => Promise<string>}
   */
  _saveFn = () => {
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

/**
 * @type {[import("zustand").UseStore<EditorStore>, EditorStore]}
 */
const [useStore, store] = createStore(EditorStore);
export { useStore, store, SESSION_STATES };

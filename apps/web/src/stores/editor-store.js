import createStore from "../common/store";
import { store as noteStore } from "./note-store";
import { store as attachmentStore } from "./attachment-store";
import { store as appStore } from "./app-store";
import { store as tagStore } from "./tag-store";
import { db } from "../common/db";
import BaseStore from ".";
import { EV, EVENTS } from "notes-core/common";
import { hashNavigate } from "../navigation";
import { qclone } from "qclone";
import { Mutex } from "async-mutex";

const SESSION_STATES = {
  stale: "stale",
  new: "new",
  locked: "locked",
  unlocked: "unlocked",
  opening: "opening",
};

const getDefaultSession = (sessionId = Date.now()) => {
  return {
    sessionType: "default",
    readonly: false,
    state: undefined,
    saveState: 1, // -1 = not saved, 0 = saving, 1 = saved
    sessionId,
    contentId: undefined,
    notebooks: undefined,
    title: "",
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
  };
};

const getDefaultPreviewSession = () => ({
  sessionType: "preview",
  state: undefined,
  dateEdited: 0,
  dateCreated: 0,
});

const savingMutex = new Mutex();
class EditorStore extends BaseStore {
  session = getDefaultSession();
  arePropertiesVisible = false;

  init = () => {
    EV.subscribe(EVENTS.userLoggedOut, () => {
      hashNavigate("/notes/create", { replace: true, addNonce: true });
    });

    EV.subscribe(EVENTS.vaultLocked, () => {
      const { id, locked } = this.get().session;
      if (locked) hashNavigate(`/notes/${id}/unlock`, { replace: true });
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

  openPreviewSession = (session) => {
    this.set((state) => {
      state.session = {
        ...getDefaultPreviewSession(),
        ...session,
        id: state.session.id,
        title: state.session.title,
        state: SESSION_STATES.new,
      };
    });
    appStore.setIsEditorOpen(true);
  };

  openLockedSession = async (note) => {
    this.set((state) => {
      state.session = {
        ...getDefaultSession(note.dateEdited),
        ...note,
        sessionType: "locked",
        id: undefined, // NOTE: we give a session id only after the note is opened.
        state: SESSION_STATES.unlocked,
      };
    });
    appStore.setIsEditorOpen(true);
    hashNavigate(`/notes/${note.id}/edit`, { replace: true });
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

    this.set((state) => {
      const defaultSession = getDefaultSession(note.dateEdited);
      state.session = {
        ...defaultSession,
        ...note,
        state: SESSION_STATES.new,
        attachmentsLength: db.attachments.ofNote(note.id, "all")?.length || 0,
      };
    });
    appStore.setIsEditorOpen(true);
  };

  saveSession = (oldSession, content) => {
    return savingMutex.runExclusive(() => {
      const session = this.get().session;
      if (session.readonly) return; // do not allow saving of readonly session

      this.setSaveState(0);
      return this._saveFn()({ ...session, content })
        .then(async (id) => {
          let note = db.notes.note(id)?.data;
          if (!note) {
            this.setSaveState(-1);
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
            state.session.notebooks = note.notebooks;
            state.session.saveState = 1;
            state.session.attachmentsLength = attachments.length;
          });

          if (!oldSession) {
            noteStore.refresh();
            attachmentStore.refresh();
            return;
          } else if (attachments?.length !== oldSession.attachmentsLength) {
            attachmentStore.refresh();
          }

          if (
            note.headline !== oldSession.headline ||
            note.title !== oldSession.title
          )
            noteStore.refresh();

          if (!oldSession.id) {
            hashNavigate(`/notes/${id}/edit`, { replace: true });
          }
        })
        .catch((err) => {
          this.setSaveState(-1);
          console.error(err);
          if (session.locked) {
            hashNavigate(`/notes/${session.id}/unlock`, { replace: true });
          }
        });
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
    const session = qclone(this.get().session);
    return this.saveSession(session, content);
  };

  getSessionContent = async () => {
    const session = this.get().session;
    switch (session.sessionType) {
      case "default":
        return await db.content.insertPlaceholders(
          await db.content.raw(session.contentId),
          "/placeholder.svg"
        );
      case "preview":
        return session.content;
      case "locked":
        return session.content;
      default:
        return;
    }
  };

  setTag = (tag) => {
    return this._setTag(tag);
  };

  setSaveState = (saveState) => {
    return this.set((state) => {
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

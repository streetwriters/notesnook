import createStore from "../common/store";
import { store as noteStore } from "./note-store";
import { store as appStore } from "./app-store";
import { store as tagStore } from "./tag-store";
import { db } from "../common/db";
import BaseStore from ".";
import { EV, EVENTS } from "notes-core/common";
import getId from "notes-core/utils/id";
import { hashNavigate } from "../navigation";

const SESSION_STATES = {
  stale: "stale",
  new: "new",
  locked: "locked",
  unlocked: "unlocked",
  opening: "opening",
};
const DEFAULT_SESSION = {
  contentId: undefined,
  notebooks: undefined,
  state: undefined,
  isSaving: false,
  title: "",
  id: "",
  pinned: false,
  favorite: false,
  locked: false,
  tags: [],
  context: undefined,
  color: undefined,
  dateEdited: 0,
  totalWords: 0,
  content: {
    type: "tiny",
    data: "",
  },
};
class EditorStore extends BaseStore {
  session = DEFAULT_SESSION;
  arePropertiesVisible = false;

  init = () => {
    EV.subscribe(EVENTS.userLoggedOut, () => this.get().newSession());
  };

  openLockedSession = async (note) => {
    this.set((state) => {
      state.session = {
        ...DEFAULT_SESSION,
        ...note,
        id: undefined, // NOTE: we give a session id only after the note is opened.
        content: note.content,
        totalWords: state.session.totalWords,
        state: SESSION_STATES.unlocked,
      };
    });
    appStore.setIsEditorOpen(true);
    hashNavigate(`/notes/${note.id}/edit`, { replace: true });
  };

  openSession = async (noteId) => {
    await db.notes.init();

    const session = this.get().session;

    if (session.id === noteId) return;

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

    let content = await db.content.raw(note.contentId);

    this.set((state) => {
      state.session = {
        ...DEFAULT_SESSION,
        ...note,
        content: content || DEFAULT_SESSION.content,
        totalWords: state.session.totalWords,
        state: SESSION_STATES.new,
      };
    });
    appStore.setIsEditorOpen(true);
  };

  saveSession = (oldSession) => {
    const session = this.get().session;
    if (session.isSaving) return; // avoid multiple in-queue saves; only save one time.
    this.set((state) => (state.session.isSaving = true));
    this._saveFn()(session).then(async (id) => {
      let note = db.notes.note(id)?.data;
      if (!note) {
        noteStore.refresh();
        return;
      }
      /* eslint-disable */
      storeSync: {
        if (oldSession?.tags?.length !== session.tags.length)
          tagStore.refresh();

        if (oldSession?.color !== session.color) appStore.refreshColors();

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

      this.set((state) => {
        state.session.id = note.id;
        state.session.title = note.title;
        state.session.isSaving = false;
        state.session.color = note.color;
        state.session.tags = note.tags;
        state.session.notebooks = note.notebooks;
      });

      noteStore.refresh();
      if (!oldSession?.id) {
        hashNavigate(`/notes/${id}/edit`, { replace: true });
      }
    });
  };

  newSession = (nonce) => {
    let context = noteStore.get().context;
    this.set((state) => {
      state.session = {
        ...DEFAULT_SESSION,
        context,
        nonce,
        state: SESSION_STATES.new,
      };
    });
    noteStore.setSelectedNote(0);
    appStore.setIsEditorOpen(true);
  };

  clearSession = (shouldNavigate = true) => {
    appStore.setIsEditorOpen(false);
    this.set((state) => {
      state.session = {
        ...DEFAULT_SESSION,
        state: SESSION_STATES.new,
      };
    });
    noteStore.setSelectedNote(0);
    this.toggleProperties(false);
    if (shouldNavigate) hashNavigate(`/`, { replace: true });
  };

  setSession = (set) => {
    const oldSession = { ...this.get().session };
    this.set(set);
    this.saveSession(oldSession);
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

  updateWordCount = (count) => {
    this.set((state) => {
      state.session.totalWords = count;
    });
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
    if (!value) return;
    const { tags, id } = this.get().session;

    let note = db.notes.note(id);
    if (!note) return;

    let index = tags.indexOf(value);
    if (index > -1) {
      await note.untag(value);
      appStore.refreshMenuPins();
    } else {
      await note.tag(value);
    }

    this.setSession(
      (state) => (state.session.tags = db.notes.note(id).data.tags)
    );
  }
}

/**
 * @type {[import("zustand").UseStore<EditorStore>, EditorStore]}
 */
const [useStore, store] = createStore(EditorStore);
export { useStore, store, SESSION_STATES };

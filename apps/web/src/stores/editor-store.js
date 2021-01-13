import createStore from "../common/store";
import { store as noteStore } from "./note-store";
import { store as appStore } from "./app-store";
import { store as tagStore } from "./tag-store";
import { db } from "../common";
import BaseStore from ".";
import { EV } from "notes-core/common";
import { hashNavigate } from "../navigation";

const SESSION_STATES = {
  stale: "stale",
  new: "new",
  locked: "locked",
  unlocked: "unlocked",
};
const DEFAULT_SESSION = {
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
    type: "delta",
    data: [],
  },
};
class EditorStore extends BaseStore {
  session = DEFAULT_SESSION;
  arePropertiesVisible = false;

  init = () => {
    EV.subscribe("user:loggedOut", () => this.get().newSession());
  };

  openLockedSession = async (note) => {
    this.set((state) => {
      state.session = {
        ...DEFAULT_SESSION,
        ...note,
        content: note.content,
        state: SESSION_STATES.unlocked,
      };
    });
    appStore.setIsEditorOpen(true);
    hashNavigate(`/notes/${note.id}/edit`, true);
  };

  openSession = async (noteId) => {
    await db.notes.init();

    const session = this.get().session;
    if (session.id === noteId && session.state === SESSION_STATES.unlocked) {
      this.set((state) => (state.session.state = SESSION_STATES.new));
      return;
    }

    let note = db.notes.note(noteId);
    if (!note) return;
    note = note.data;

    noteStore.setSelectedNote(note.id);

    if (note.locked) return hashNavigate(`/notes/${noteId}/unlock`, true);
    if (note.conflicted) return hashNavigate(`/notes/${noteId}/conflict`, true);

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
    this.set((state) => (state.session.isSaving = true));

    this._saveFn()(this.get().session).then(async (id) => {
      const note = db.notes.note(id)?.data;
      if (!note) {
        noteStore.refresh();
        return;
      }
      /* eslint-disable */
      storeSync: {
        const session = this.get().session;
        if (oldSession?.tags?.length !== session.tags.length)
          tagStore.refresh();

        if (oldSession?.color !== session.color) appStore.refreshColors();

        if (!oldSession?.context) break storeSync;

        const { type, value } = oldSession.context;
        if (type === "topic") await db.notes.move(value, id);
        else if (type === "color") await db.notes.note(id).color(value);
        else if (type === "tag") await db.notes.note(id).tag(value);
      }
      /* eslint-enable */

      if (!this.get().session.id) {
        noteStore.setSelectedNote(id);
      }

      this.set((state) => {
        state.session.id = id;
        state.session.title = note.title;
        state.session.isSaving = false;
        state.session.color = note.color;
        state.session.tags = note.tags;
      });

      noteStore.refresh();
      if (!oldSession?.id) {
        hashNavigate(`/notes/${id}/edit`, true, true);
      }
    });
  };

  newSession = (context = {}) => {
    this.set((state) => {
      state.session = {
        ...DEFAULT_SESSION,
        context,
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
    if (shouldNavigate) hashNavigate(`/`, true);
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

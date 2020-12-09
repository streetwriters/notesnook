import createStore from "../common/store";
import { store as noteStore } from "./note-store";
import { store as appStore } from "./app-store";
import { store as tagStore } from "./tag-store";
import { db } from "../common";
import BaseStore from ".";
import { isMobile, isTablet } from "../utils/dimensions";
import { getHashParam, setHashParam } from "../utils/useHashParam";
import { qclone } from "qclone";

const SESSION_STATES = { stale: "stale", new: "new", locked: "locked" };
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
    window.addEventListener("hashchange", async () => {
      const note = getHashParam("note");

      if (this.get().session.id === note) return;

      if (isMobile() && !note && appStore.get().isEditorOpen) {
        return this.clearSession();
      }

      if (note) await this.openSession(note);
    });
  };

  openLastSession = () => {
    // Do not reopen last session on mobile
    if (isMobile() && isTablet()) return;
    const id = localStorage.getItem("lastOpenedNote");

    if (id) {
      db.notes.init().then(() => {
        setHashParam({ note: id });
      });
    }
  };

  openLockedSession = async (note) => {
    setHashParam({});
    setHashParam({ note: note.id }, false);
    saveLastOpenedNote(note.id);
    this.set((state) => {
      state.session = {
        ...DEFAULT_SESSION,
        ...note,
        content: note.content,
        state: SESSION_STATES.new,
      };
    });
    appStore.setIsEditorOpen(true);
  };

  openSession = async (noteId) => {
    let note = db.notes.note(noteId);
    if (!note) return;
    note = qclone(note.data);

    noteStore.setSelectedNote(note.id);

    if (note.locked) return setHashParam({ unlock: noteId });
    if (note.conflicted) return setHashParam({ diff: noteId });

    saveLastOpenedNote(note.id);

    let content = await db.content.raw(note.contentId);

    this.set((state) => {
      state.session = {
        ...DEFAULT_SESSION,
        ...note,
        content: content || DEFAULT_SESSION.content,
        state: SESSION_STATES.new,
      };
    });
    appStore.setIsEditorOpen(true);
  };

  saveSession = (oldSession) => {
    this.set((state) => (state.session.isSaving = true));

    this._saveFn()(this.get().session).then(async (id) => {
      /* eslint-disable */
      storeSync: if (oldSession) {
        if (oldSession.tags.length !== this.get().session.tags.length)
          tagStore.refresh();

        if (oldSession.color !== this.get().session.color)
          appStore.refreshColors();

        if (!oldSession.context) break storeSync;

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
        state.session.title = db.notes.note(id).title;
        state.session.isSaving = false;
      });

      noteStore.refresh();

      saveLastOpenedNote(!this.get().session.locked && id);

      if (!oldSession.index) {
        setHashParam({ note: id }, false);
      }
    });
  };

  newSession = (context = {}) => {
    appStore.setIsEditorOpen(true);
    this.set(function (state) {
      state.session = {
        ...DEFAULT_SESSION,
        context,
        state: SESSION_STATES.new,
      };
    });
    saveLastOpenedNote();
    noteStore.setSelectedNote(0);
    setHashParam({ note: 0 });
  };

  clearSession = () => {
    appStore.setIsEditorOpen(false);
    this.set(function (state) {
      state.session = {
        ...DEFAULT_SESSION,
      };
    });
    saveLastOpenedNote();
    noteStore.setSelectedNote(0);
    setHashParam({});
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
    const { tags, id } = this.get().session;

    let note = db.notes.note(id);
    if (!note) return;

    let index = tags.indexOf(value);
    if (index > -1) {
      await note.untag(value);
    } else {
      await note.tag(value);
    }

    this.setSession(
      (state) => (state.session.tags = db.notes.note(id).data.tags)
    );
  }
}

function saveLastOpenedNote(id) {
  if (!id) return localStorage.removeItem("lastOpenedNote");
  localStorage.setItem("lastOpenedNote", id);
}

/**
 * @type {[import("zustand").UseStore<EditorStore>, EditorStore]}
 */
const [useStore, store] = createStore(EditorStore);
export { useStore, store, SESSION_STATES };

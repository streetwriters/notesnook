import createStore from "../common/store";
import { store as noteStore } from "./note-store";
import { store as appStore } from "./app-store";
import { store as tagStore } from "./tag-store";
import { store as mergeStore } from "./mergestore";
import { db } from "../common";
import BaseStore from ".";
import EditorNavigator from "../navigation/navigators/editornavigator";
import { isMobile } from "../utils/dimensions";

const SESSION_STATES = { stale: "stale", new: "new" };
const DEFAULT_SESSION = {
  notebook: undefined,
  state: undefined,
  isSaving: false,
  title: "",
  timeout: 0,
  id: "",
  pinned: false,
  favorite: false,
  locked: false,
  tags: [],
  context: undefined,
  colors: [],
  dateEdited: 0,
  content: {
    text: "",
    delta: {
      ops: [],
    },
  },
};
class EditorStore extends BaseStore {
  session = DEFAULT_SESSION;
  arePropertiesVisible = false;

  openLastSession = async () => {
    // Do not reopen last session on mobile
    if (isMobile()) return;

    const id = localStorage.getItem("lastOpenedNote");
    const note = db.notes.note(id);
    if (!id || !note) {
      return EditorNavigator.navigate("editor");
    }
    await this.openSession(note.data);
  };

  openSession = async (note) => {
    clearTimeout(this.get().session.timeout);

    if (note.conflicted) {
      return await mergeStore.openConflict(note);
    }

    noteStore.setSelectedNote(note.id);
    saveLastOpenedNote(note.id);

    let content = {};
    if (!note.locked) {
      content = {
        text: await db.notes.note(note).text(),
        delta: await db.notes.note(note).delta(),
      };
    } else {
      content = await EditorNavigator.navigateWithResult("unlock", {
        id: note.id,
      });
      console.log(content);
      if (!content) return;
    }

    this.set((state) => {
      state.session = {
        ...DEFAULT_SESSION,
        ...note,
        content,
        state: SESSION_STATES.new,
      };
    });

    EditorNavigator.navigate("editor");
  };

  saveSession = (oldSession) => {
    this.set((state) => (state.session.isSaving = true));
    this._saveFn()(this.get().session).then(async (id) => {
      /* eslint-disable */
      storeSync: if (oldSession) {
        if (oldSession.tags.length !== this.get().session.tags.length)
          tagStore.refresh();

        if (oldSession.colors.length !== this.get().session.colors.length)
          appStore.refreshColors();

        if (oldSession.state !== "new" || !oldSession.context) break storeSync;

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
        state.session.isSaving = false;
      });

      noteStore.refresh();

      saveLastOpenedNote(!this.get().session.locked && id);
    });
  };

  newSession = (context = {}) => {
    EditorNavigator.navigate("editor");
    clearTimeout(this.get().session.timeout);
    this.set(function (state) {
      state.session = {
        ...DEFAULT_SESSION,
        context,
        state: SESSION_STATES.new,
      };
    });
    saveLastOpenedNote();
    noteStore.setSelectedNote(0);
  };

  setSession = (set, immediate = false) => {
    clearTimeout(this.get().session.timeout);
    const oldSession = { ...this.get().session };

    // TODO test this
    this.set((state) => {
      if (state.session.state !== SESSION_STATES.stale)
        state.session.state = SESSION_STATES.stale;
    });

    this.set((state) => {
      set(state);

      state.session.timeout = setTimeout(
        () => {
          this.session = this.get().session;
          this.saveSession(oldSession);
        },
        immediate ? 0 : 500
      );
    });
  };

  toggleLocked = () => {
    if (this.get().session.locked) noteStore.unlock(this.get().session.id);
    else noteStore.lock(this.get().session.id);
  };

  setColor = (color) => {
    this._setTagOrColor("color", color);
  };

  setTag = (tag) => {
    this._setTagOrColor("tag", tag);
  };

  toggleProperties = () => {
    this.set(
      (state) => (state.arePropertiesVisible = !state.arePropertiesVisible)
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

  _setTagOrColor(key, value) {
    const array = key === "tag" ? "tags" : "colors";
    const { [array]: arr, id } = this.get().session;

    let note = db.notes.note(id);
    if (!note) return;

    let index = arr.indexOf(value);
    if (index > -1) {
      note[`un${key}`](value).then(() => {
        this.setSession((state) => state.session[array].splice(index, 1), true);
      });
    } else {
      note[key](value).then(() => {
        this.setSession((state) => state.session[array].push(value), true);
      });
    }
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

import createStore from "../common/store";
import { store as noteStore } from "./note-store";
import { store as appStore } from "./app-store";
import { store as tagStore } from "./tag-store";
import { db } from "../common";
import EditorNavigator from "../navigation/navigators/editornavigator";
import BaseStore from ".";
import Vault from "../common/vault.ts";

const SESSION_STATES = { stale: "stale", new: "new" };
const DEFAULT_SESSION = { timeout: undefined, state: SESSION_STATES.new };
class EditorStore extends BaseStore {
  session = DEFAULT_SESSION;

  openLastSession = () => {
    const id = localStorage.getItem("lastOpenedNote");
    if (!id) return;
    this.openSession(db.notes.note(id).data);
  };

  openSession = async note => {
    clearTimeout(this.session.timeout);

    if (note.conflicted) {
      return EditorNavigator.navigate("split", { note });
    } else {
      EditorNavigator.navigate("editor");
    }

    let content = {};
    if (!note.locked) {
      content = {
        text: note.content.text,
        delta: await db.notes.note(note).delta()
      };
    } else {
      content = await Vault.openNote(note.id);
      if (!content) return;
    }

    this.set(state => {
      state.session = {
        ...DEFAULT_SESSION,
        ...note,
        content
      };
    });

    noteStore.setSelectedNote(note.id);
  };

  saveSession = oldSession => {
    this.set(state => (state.session.isSaving = true));

    this._saveFn(this.session.locked)(this.session).then(id => {
      if (!oldSession) {
        if (oldSession.tags.length !== this.session.tags.length)
          tagStore.refresh();
        if (oldSession.colors.length !== this.session.colors.length)
          appStore.refreshColors();
      }

      if (!this.session.id) {
        noteStore.setSelectedNote(id);
      }

      this.set(state => {
        state.session.id = id;
        state.session.isSaving = false;
      });

      noteStore.refresh();

      saveLastOpenedNote(!this.session.locked && id);
    });
  };

  newSession = (context = {}) => {
    clearTimeout(this.session.timeout);
    this.set(function(state) {
      state.session = {
        ...DEFAULT_SESSION,
        ...context
      };
    });
    saveLastOpenedNote();
    noteStore.setSelectedNote(0);
  };

  setSession = set => {
    clearTimeout(this.session.timeout);
    const oldSession = { ...this.session };
    this.set(state => {
      state.session.state = SESSION_STATES.stale;
      set(state);
      state.session.timeout = setTimeout(() => {
        this.saveSession(oldSession);
      }, 500);
    });
  };

  toggleLocked = () => {
    if (this.session.locked) noteStore.unlock(this.session.id);
    else noteStore.lock(this.session.id);
  };

  setColor = color => {
    this._setTagOrColor("color", color);
  };

  setTag = tag => {
    this._setTagOrColor("tag", tag);
  };

  /**
   * @private internal
   * @param {Boolean} isLocked
   * @returns {(note: any) => Promise<string>}
   */
  _saveFn(isLocked) {
    return isLocked
      ? db.vault.save.bind(db.vault)
      : db.notes.add.bind(db.notes);
  }

  _setTagOrColor(key, value) {
    const array = key === "tag" ? "tags" : "colors";
    const { [array]: arr, id } = this.session;

    let note = db.notes.note(id);
    if (!note) return;

    let index = arr.indexOf(value);
    if (index > -1) {
      note[`un${key}`](value).then(() => {
        this.set(state => state.session[array].splice(index, 1));
      });
    } else {
      note[key](value).then(() => {
        this.set(state => state.session[array].push(value));
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
export { useStore, store };

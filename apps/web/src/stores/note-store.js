import { db } from "../common/index";
import createStore from "../common/store";
import { store as editorStore } from "./editor-store";
import Vault from "../common/vault";
import BaseStore from ".";

class NoteStore extends BaseStore {
  notes = {
    items: [],
    groupCounts: [],
    groups: [],
  };
  context = undefined;
  selectedNote = 0;

  init = () => {
    db.ev.subscribe("notes:removeEmptyNote", (id) => {
      const { session, newSession } = editorStore.get();
      if (session.id === id) {
        newSession();
      }
    });
  };

  setSelectedNote = (id) => {
    this.set((state) => (state.selectedNote = id));
  };

  refresh = () => {
    this.refreshContext();
    this.set((state) => (state.notes = db.notes.group(undefined, true)));
  };

  refreshContext = () => {
    const context = this.get().context;
    if (!context) return;
    this.setContext(context);
  };

  setContext = (context) => {
    let notes = [];
    switch (context.type) {
      case "tag":
        notes = db.notes.tagged(context.value);
        break;
      case "color":
        notes = db.notes.colored(context.value);
        break;
      case "topic":
        notes = db.notebooks
          .notebook(context.value.id)
          .topics.topic(context.value.topic).all;
        break;
      case "favorites":
        notes = db.notes.favorites;
        break;
      default:
        return;
    }
    this.set((state) => (state.context = { ...context, notes }));
  };

  delete = async (id) => {
    await db.notes.delete(id);
    this.refreshContext();
    this.refresh();
    const { session, newSession } = editorStore.get();
    if (session.id === id) {
      newSession();
    }
  };

  pin = async (note) => {
    await db.notes.note(note).pin();
    this.refresh();
    this._syncEditor(note.id, "pinned", !note.pinned);
  };

  favorite = async (note) => {
    await db.notes.note(note).favorite();
    setTimeout(() => this.refreshContext(), 0);
    this._setValue(note.id, "favorite", !note.favorite);
  };

  unlock = async (id) => {
    await Vault.unlockNote(id, () => this._setValue(id, "locked", false));
  };

  lock = async (id) => {
    await Vault.lockNote(id, () => this._setValue(id, "locked", true));
  };

  setColor = async (id, color) => {
    const note = db.notes.note(id);
    if (!note) return;
    let index = note.data.colors.indexOf(color);
    if (index > -1) {
      await note.uncolor(color);
    } else {
      await note.color(color);
    }
    this._setValue(id, "colors", db.notes.note(id).data.colors);
  };

  /**
   * @private
   */
  _setValue = (noteId, prop, value) => {
    this.set((state) => {
      const { context, notes } = state;
      const arr = !context ? notes.items : context.notes;
      let index = arr.findIndex((note) => note.id === noteId);
      if (index < 0) return;

      arr[index][prop] = value;
      this._syncEditor(noteId, prop, value);
    });
  };

  /**
   * @private
   */
  _syncEditor = (noteId, action, value) => {
    const { session, setSession } = editorStore.get();
    if (session.id === noteId) {
      setSession((state) => (state.session[action] = value));
    }
  };
}

/**
 * @type {[import("zustand").UseStore<NoteStore>, NoteStore]}
 */
const [useStore, store] = createStore(NoteStore);
export { useStore, store };

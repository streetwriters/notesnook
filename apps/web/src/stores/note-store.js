import { db, notesFromContext } from "../common/index";
import createStore from "../common/store";
import { store as editorStore } from "./editor-store";
import { store as appStore } from "./app-store";
import Vault from "../common/vault";
import BaseStore from ".";
import { EV } from "notes-core/common";
import Config from "../utils/config";
import { showToast } from "../utils/toast";

class NoteStore extends BaseStore {
  notes = [];
  context = undefined;
  selectedNote = 0;

  init = () => {
    EV.subscribe("notes:removeEmptyNote", (id) => {
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
    this.set(
      (state) =>
        (state.notes = db.notes.group(
          Config.get("selectedGroup"),
          Config.get("sortDirection", "desc")
        ))
    );
  };

  refreshContext = () => {
    const context = this.get().context;
    if (!context) return;
    this.setContext(context);
  };

  setContext = (context) => {
    let notes = notesFromContext(context);
    this.set((state) => (state.context = { ...context, notes }));
  };

  delete = async (id) => {
    await db.notes.delete(id);
    this.refreshContext();
    this.refresh();
    appStore.refreshColors();
    const { session, newSession } = editorStore.get();
    if (session.id === id) {
      newSession();
    }
  };

  pin = async (id) => {
    // TODO (hack) we probably shouldn't do this here.
    const note = db.notes.note(id);
    if (!note.data.pinned && db.notes.pinned.length >= 3) {
      await showToast("error", "You cannot pin more than 3 notes.");
      return;
    }
    if (!this._syncEditor(note.id, "pinned", !note.data.pinned)) {
      await note.pin();
      this.refresh();
    }
  };

  favorite = async (id) => {
    const note = db.notes.note(id);
    if (!this._syncEditor(note.id, "favorite", !note.data.favorite)) {
      await note.favorite();
      this.refresh();
    }
  };

  unlock = async (id) => {
    return await Vault.unlockNote(id).then(async (res) => {
      if (editorStore.get().session.id === id)
        await editorStore.openSession(id);
      this.refresh();
      return res;
    });
  };

  lock = async (id) => {
    await Vault.lockNote(id).then(async () => {
      if (editorStore.get().session.id === id)
        await editorStore.openSession(id);
      this.refresh();
    });
  };

  setColor = async (id, color) => {
    let note = db.notes.note(id);
    if (!note) return;
    if (note.data.color === color) await db.notes.note(id).uncolor();
    else await db.notes.note(id).color(color);
    appStore.refreshColors();
    if (!this._syncEditor(note.id, "color", db.notes.note(id).data.color)) {
      this.refresh();
    }
  };

  /**
   * @private
   */
  _syncEditor = (noteId, action, value) => {
    const { session, setSession } = editorStore.get();
    if (session.id !== noteId) return false;
    setSession((state) => (state.session[action] = value), true);
    return true;
  };
}

/**
 * @type {[import("zustand").UseStore<NoteStore>, NoteStore]}
 */
const [useStore, store] = createStore(NoteStore);
export { useStore, store };

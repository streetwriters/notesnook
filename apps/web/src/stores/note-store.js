import { notesFromContext } from "../common";
import { db } from "../common/db";
import createStore from "../common/store";
import { store as editorStore } from "./editor-store";
import { store as appStore } from "./app-store";
import Vault from "../common/vault";
import BaseStore from ".";
import { EV, EVENTS } from "notes-core/common";
import Config from "../utils/config";
import { qclone } from "qclone";
import { hashNavigate } from "../navigation";
import { groupArray } from "notes-core/utils/grouping";

class NoteStore extends BaseStore {
  notes = [];
  context = undefined;
  selectedNote = 0;
  viewMode = Config.get("notes:viewMode", "detailed");

  setViewMode = (viewMode) => {
    this.set((state) => (state.viewMode = viewMode));
    Config.set("notes:viewMode", viewMode);
  };

  init = () => {
    EV.subscribe(EVENTS.noteRemoved, (id) => {
      const { session } = editorStore.get();
      if (session.id === id) {
        hashNavigate("/notes/create", { addNonce: true });
      }
    });
  };

  setSelectedNote = (id) => {
    this.set((state) => (state.selectedNote = id));
  };

  refresh = () => {
    this.set((state) => {
      state.notes = groupArray(
        db.notes.all,
        db.settings.getGroupOptions("home")
      );
    });
    this.refreshContext();
  };

  refreshContext = () => {
    const context = this.get().context;
    if (!context) return;
    this.setContext(context);
  };

  clearContext = () => {
    this.set((state) => {
      state.context = undefined;
    });
  };

  setContext = (context) => {
    db.notes.init().then(() => {
      this.set((state) => {
        state.context = {
          ...context,
          notes: qclone(notesFromContext(context)),
        };
      });
    });
  };

  delete = async (id) => {
    const { session, clearSession } = editorStore.get();
    if (session && session.id === id) {
      await clearSession();
    }

    await db.notes.delete(id);

    this.refresh();
    appStore.refreshMenuPins();
    appStore.refreshColors();
  };

  pin = async (id) => {
    const note = db.notes.note(id);
    if (!note.data.pinned && db.notes.pinned.length >= 3) {
      throw new Error("You cannot pin more than 3 notes.");
    }
    await note.pin();
    this._syncEditor(note.id, "pinned", !note.data.pinned);
    this.refresh();
  };

  favorite = async (id) => {
    const note = db.notes.note(id);
    await note.favorite();
    this._syncEditor(note.id, "favorite", !note.data.favorite);
    this.refresh();
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
    await Vault.lockNote(id);
    this.refresh();
    if (editorStore.get().session.id === id)
      await editorStore.openSession(id, true);
  };

  setColor = async (id, color) => {
    try {
      let note = db.notes.note(id);
      if (!note) return;
      if (note.data.color === color) await db.notes.note(id).uncolor();
      else await db.notes.note(id).color(color);
      appStore.refreshColors();
      this._syncEditor(note.id, "color", db.notes.note(id).data.color);
      this.refresh();
    } catch (e) {
      console.error(e);
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

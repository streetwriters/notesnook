/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { db } from "../common/db";
import createStore from "../common/store";
import { store as editorStore } from "./editor-store";
import { store as appStore } from "./app-store";
import { store as selectionStore } from "./selection-store";
import Vault from "../common/vault";
import BaseStore from ".";
import { EV, EVENTS } from "@notesnook/core/common";
import Config from "../utils/config";
import { hashNavigate } from "../navigation";
import { groupArray } from "@notesnook/core/utils/grouping";

class NoteStore extends BaseStore {
  notes = [];
  context = undefined;
  selectedNote = 0;
  nonce = 0;
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
    if (!id) selectionStore.get().toggleSelectionMode(false);
    this.set((state) => (state.selectedNote = id));
  };

  refresh = () => {
    this.get().notes = groupArray(
      db.notes.all,
      db.settings.getGroupOptions("home")
    );
    this._forceUpdate();
    this.refreshContext();
  };

  refreshItem = (id, newNote) => {
    const notes = this.get().notes;
    const index = notes.findIndex((n) => n.id === id);
    if (index <= -1) return;
    newNote = newNote || db.notes.note(id).data;
    notes[index] = newNote;
    this._forceUpdate();
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
      this.get().context = { ...context, notes: notesFromContext(context) };
      this._forceUpdate();
    });
  };

  delete = async (...ids) => {
    const { session, clearSession } = editorStore.get();
    for (let id of ids) {
      if (session && session.id === id) {
        await clearSession();
      }
    }

    await db.notes.delete(...ids);

    this.refresh();
    appStore.refreshNavItems();
  };

  pin = async (id) => {
    const note = db.notes.note(id);
    await note.pin();
    this._syncEditor(note.id, "pinned", !note.data.pinned);
    this.refresh();
  };

  favorite = async (id) => {
    const note = db.notes.note(id);
    await note.favorite();
    this._syncEditor(note.id, "favorite", !note.data.favorite);
    this.refreshItem(id);
  };

  unlock = async (id) => {
    return await Vault.unlockNote(id).then(async (res) => {
      if (editorStore.get().session.id === id)
        await editorStore.openSession(id);
      this.refreshItem(id);
      return res;
    });
  };

  dateCreated = async (id, dateCreated) => {
    await db.notes.add({ id, dateCreated });
    this._syncEditor(id, "dateCreated", dateCreated);
    this.refresh();
  };

  lock = async (id) => {
    await Vault.lockNote(id);
    this.refreshItem(id);
    if (editorStore.get().session.id === id)
      await editorStore.openSession(id, true);
  };

  readonly = async (id) => {
    const note = db.notes.note(id);
    await note.readonly();
    this._syncEditor(note.id, "readonly", !note.data.readonly);
    this.refreshItem(id);
  };

  duplicate = async (note) => {
    const id = await db.notes.note(note).duplicate();
    this.refresh();
    return id;
  };

  localOnly = async (id) => {
    const note = db.notes.note(id);
    await note.localOnly();
    this._syncEditor(note.id, "localOnly", !note.data.localOnly);
    this.refreshItem(id);
  };

  setColor = async (id, color) => {
    try {
      let note = db.notes.note(id);
      if (!note) return;
      if (note.data.color === color) await db.notes.note(id).uncolor();
      else await db.notes.note(id).color(color);
      appStore.refreshNavItems();
      this._syncEditor(note.id, "color", db.notes.note(id).data.color);
      this.refreshItem(id);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * @private
   */
  _syncEditor = (noteId, action, value) => {
    const { session, toggle } = editorStore.get();
    if (session.id !== noteId) return false;
    toggle(session.id, action, value);
    return true;
  };

  /**
   * @private
   */
  _forceUpdate = () => {
    this.set((state) => {
      state.nonce++;
    });
  };
}

/**
 * @type {[import("zustand").UseStore<NoteStore>, NoteStore]}
 */
const [useStore, store] = createStore(NoteStore);
export { useStore, store };

function notesFromContext(context) {
  let notes = [];
  switch (context.type) {
    case "tag":
      notes = db.notes.tagged(context.value);
      break;
    case "color":
      notes = db.notes.colored(context.value);
      break;
    case "topic": {
      const notebook = db.notebooks.notebook(context?.value?.id);
      if (!notebook) break;
      const topic = notebook.topics?.topic(context?.value?.topic);
      if (!topic) break;
      notes = topic.all;
      break;
    }
    case "favorite":
      notes = db.notes.favorites;
      break;
    case "monographs":
      notes = db.monographs.all;
      break;
    default:
      return [];
  }
  return notes;
}

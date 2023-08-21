/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

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
import Config from "../utils/config";
import { groupArray } from "@notesnook/core/dist/utils/grouping";

/**
 * @extends {BaseStore<NoteStore>}
 */
class NoteStore extends BaseStore {
  notes = [];
  /**
   * @type {import("../components/list-container/types").Context | undefined}
   */
  context = undefined;
  selectedNote = "";
  nonce = 0;
  viewMode = Config.get("notes:viewMode", "detailed");

  setViewMode = (viewMode) => {
    this.set((state) => (state.viewMode = viewMode));
    Config.set("notes:viewMode", viewMode);
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
    this.get().context = { ...context, notes: notesFromContext(context) };
    this._forceUpdate();
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
        await editorStore.clearSession(true);
      this.refreshItem(id);
      return res;
    });
  };

  lock = async (id) => {
    if (!(await Vault.lockNote(id))) return false;
    this.refreshItem(id);
    if (editorStore.get().session.id === id)
      await editorStore.openSession(id, true);
    return true;
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
      const colorId =
        db.tags.find(color)?.id || (await db.colors.add({ title: color }));
      const isColored =
        db.relations.from({ type: "color", id: colorId }, "note").length > 0;

      if (isColored)
        await db.relations.unlink({ type: "color", id: colorId }, note._note);
      else await db.relations.add({ type: "color", id: colorId }, note._note);

      appStore.refreshNavItems();
      this._syncEditor(note.id, "color", color);
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

const [useStore, store] = createStore(NoteStore);
export { useStore, store };

function notesFromContext(context) {
  let notes = [];
  switch (context.type) {
    case "tag":
    case "color":
      notes = db.relations
        .from({ type: context.type, id: context.value }, "note")
        .resolved();
      break;
    case "notebook": {
      const notebook = db.notebooks.notebook(context?.value?.id);
      if (!notebook) break;
      notes = db.relations.from(notebook.data, "note").resolved();
      break;
    }
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

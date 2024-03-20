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
import { store as appStore } from "./app-store";
import Vault from "../common/vault";
import BaseStore from ".";
import Config from "../utils/config";
import { Note, VirtualizedGrouping } from "@notesnook/core";
import { Context } from "../components/list-container/types";

type ViewMode = "detailed" | "compact";
class NoteStore extends BaseStore<NoteStore> {
  notes: VirtualizedGrouping<Note> | undefined = undefined;
  contextNotes: VirtualizedGrouping<Note> | undefined = undefined;
  context: Context | undefined = undefined;
  // nonce = 0;
  viewMode: ViewMode = Config.get("notes:viewMode", "detailed");

  setViewMode = (viewMode: ViewMode) => {
    this.set((state) => (state.viewMode = viewMode));
    Config.set("notes:viewMode", viewMode);
  };

  refresh = async () => {
    const grouping = await db.notes.all.grouped(
      db.settings.getGroupOptions("home")
    );
    this.set((state) => {
      state.notes = grouping;
    });
    await this.refreshContext();
  };

  refreshContext = async () => {
    const context = this.get().context;
    if (!context) return;
    await this.setContext(context);
  };

  setContext = async (context?: Context) => {
    this.set({
      context,
      contextNotes: context
        ? await notesFromContext(context).grouped(
            db.settings.getGroupOptions(
              context.type === "favorite" ? "favorites" : "notes"
            )
          )
        : undefined
    });
  };

  delete = async (...ids: string[]) => {
    await db.notes.moveToTrash(...ids);
    await this.refresh();
  };

  pin = async (state: boolean, ...ids: string[]) => {
    await db.notes.pin(state, ...ids);
    await this.refresh();
  };

  favorite = async (state: boolean, ...ids: string[]) => {
    await db.notes.favorite(state, ...ids);
    await this.refresh();
  };

  unlock = async (id: string) => {
    return await Vault.unlockNote(id).then(async (res) => {
      await this.refresh();
      return res;
    });
  };

  lock = async (id: string) => {
    if (!(await Vault.lockNote(id))) return false;
    await this.refresh();
  };

  readonly = async (state: boolean, ...ids: string[]) => {
    await db.notes.readonly(state, ...ids);
    await this.refresh();
  };

  duplicate = async (...ids: string[]) => {
    await db.notes.duplicate(...ids);
    await this.refresh();
  };

  localOnly = async (state: boolean, ...ids: string[]) => {
    await db.notes.localOnly(state, ...ids);
    await this.refresh();
  };

  setColor = async (colorId: string, isChecked: boolean, ...ids: string[]) => {
    await db.relations.to({ type: "note", ids }, "color").unlink();
    if (!isChecked) {
      for (const id of ids) {
        await db.relations.add(
          { type: "color", id: colorId },
          { type: "note", id }
        );
      }
    }
    await appStore.refreshNavItems();
    await this.refresh();
  };
}

const [useStore, store] = createStore<NoteStore>(
  (set, get) => new NoteStore(set, get)
);
export { useStore, store };

export function notesFromContext(context: Context) {
  switch (context.type) {
    case "notebook":
    case "tag":
    case "color":
      return db.relations.from({ type: context.type, id: context.id }, "note")
        .selector;
    case "favorite":
      return db.notes.favorites;
    case "monographs":
      return db.monographs.all;
  }
}

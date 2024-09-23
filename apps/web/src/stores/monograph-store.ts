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

import createStore from "../common/store";
import { db } from "../common/db";
import BaseStore from "./index";
import { store as noteStore } from "./note-store";
import { Note, VirtualizedGrouping, PublishOptions } from "@notesnook/core";

class MonographStore extends BaseStore<MonographStore> {
  monographs: VirtualizedGrouping<Note> | undefined = undefined;

  refresh = async () => {
    const grouping = await db.monographs.all.grouped(
      db.settings.getGroupOptions("notes")
    );
    this.set({ monographs: grouping });
  };

  publish = async (noteId: string, opts: PublishOptions) => {
    const publishId = await db.monographs.publish(noteId, opts);
    await this.get().refresh();
    await noteStore.refreshContext();
    return publishId;
  };

  unpublish = async (noteId: string) => {
    await db.monographs.unpublish(noteId);
    await this.get().refresh();
    await noteStore.refreshContext();
  };
}

const [useStore, store] = createStore<MonographStore>(
  (set, get) => new MonographStore(set, get)
);
export { useStore, store };

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
import { store as noteStore } from "./note-store";
import BaseStore from "./index";
import Config from "../utils/config";
import { Notebook, VirtualizedGrouping } from "@notesnook/core";

type ViewMode = "detailed" | "compact";
class NotebookStore extends BaseStore<NotebookStore> {
  notebooks?: VirtualizedGrouping<Notebook>;
  viewMode = Config.get<ViewMode>("notebooks:viewMode", "detailed");

  setViewMode = (viewMode: ViewMode) => {
    this.set((state) => (state.viewMode = viewMode));
    Config.set("notebooks:viewMode", viewMode);
  };

  refresh = async () => {
    const notebooks = await db.notebooks.roots.grouped(
      db.settings.getGroupOptions("notebooks")
    );
    this.set({ notebooks });
  };

  delete = async (...ids: string[]) => {
    await db.notebooks.moveToTrash(...ids);
    await this.refresh();
    await appStore.refreshNavItems();
    await noteStore.refresh();
  };

  pin = async (state: boolean, ...ids: string[]) => {
    await db.notebooks.pin(state, ...ids);
    await this.refresh();
  };
}

const [useStore, store] = createStore<NotebookStore>(
  (set, get) => new NotebookStore(set, get)
);
export { useStore, store };

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
import { groupArray } from "@notesnook/core/utils/grouping";
import Config from "../utils/config";

/**
 * @extends {BaseStore<NotebookStore>}
 */
class NotebookStore extends BaseStore {
  notebooks = [];
  /**
   * @type {any | undefined}
   */
  selectedNotebook = undefined;
  selectedNotebookTopics = [];
  viewMode = Config.get("notebooks:viewMode", "detailed");

  setViewMode = (viewMode) => {
    this.set((state) => (state.viewMode = viewMode));
    Config.set("notebooks:viewMode", viewMode);
  };

  refresh = () => {
    this.set((state) => {
      state.notebooks = groupArray(
        db.notebooks.all,
        db.settings.getGroupOptions("notebooks")
      );
    });
    this.setSelectedNotebook(this.get().selectedNotebook?.id);
  };

  delete = async (...ids) => {
    await db.notebooks.delete(...ids);
    this.refresh();
    appStore.refreshNavItems();
    noteStore.refresh();
  };

  pin = async (notebookId) => {
    const notebook = db.notebooks.notebook(notebookId);
    await notebook.pin();
    this.refresh();
  };

  setSelectedNotebook = (id) => {
    if (!id) return;
    const notebook = db.notebooks?.notebook(id)?.data;
    if (!notebook) return;

    this.set((state) => {
      state.selectedNotebook = notebook;
      state.selectedNotebookTopics = groupArray(
        notebook.topics,
        db.settings.getGroupOptions("topics")
      );
    });
  };
}

const [useStore, store] = createStore(NotebookStore);
export { useStore, store };

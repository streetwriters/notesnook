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
import BaseStore from "./index";
import { store as appStore } from "./app-store";
import { store as noteStore } from "./note-store";
import { store as notebookStore } from "./notebook-store";
import { TrashItem, VirtualizedGrouping } from "@notesnook/core";
import { showToast } from "../utils/toast";
import { strings } from "@notesnook/intl";

class TrashStore extends BaseStore<TrashStore> {
  trash: VirtualizedGrouping<TrashItem> | undefined = undefined;

  refresh = async () => {
    const grouping = await db.trash.grouped(
      db.settings.getGroupOptions("trash")
    );
    this.set({ trash: grouping });
  };

  delete = async (...ids: string[]) => {
    await db.trash.delete(...ids);
    await this.get().refresh();
  };

  restore = async (...ids: string[]) => {
    await db.trash.restore(...ids);
    showToast("success", strings.actions.restored.item(ids.length));
    await this.get().refresh();
    await appStore.refreshNavItems();
    await noteStore.refresh();
    await notebookStore.refresh();
  };

  clear = async () => {
    await db.trash.clear();
    await this.get().refresh();
  };
}

const [useStore, store] = createStore<TrashStore>(
  (set, get) => new TrashStore(set, get)
);
export { useStore, store };

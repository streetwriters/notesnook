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
import { store as notestore } from "./note-store";
import { groupArray } from "@notesnook/core/utils/grouping";

/**
 * @extends {BaseStore<TrashStore>}
 */
class TrashStore extends BaseStore {
  trash = [];

  refresh = () => {
    this.set(
      (state) =>
        (state.trash = groupArray(
          db.trash.all,
          db.settings.getGroupOptions("trash")
        ))
    );
  };

  delete = (ids, commit = false) => {
    if (!commit) {
      return this.set((state) => {
        for (let id of ids) {
          const index = state.trash.findIndex((item) => item.id === id);
          if (index > -1) state.trash.splice(index, 1);
        }
      });
    }
    return db.trash.delete(...ids);
  };

  restore = (ids) => {
    return db.trash.restore(...ids).then(() => {
      this.refresh();
      appStore.refreshNavItems();
      notestore.refresh();
    });
  };

  clear = () => {
    return db.trash.clear().then(() => {
      this.set((state) => (state.trash = []));
    });
  };
}

const [useStore, store] = createStore(TrashStore);
export { useStore, store };

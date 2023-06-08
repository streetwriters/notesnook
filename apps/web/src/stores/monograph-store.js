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
import { store as notestore } from "./note-store";

/**
 * @extends {BaseStore<MonographStore>}
 */
class MonographStore extends BaseStore {
  monographs = [];

  refresh = () => {
    this.set((state) => (state.monographs = db.monographs.all));
  };

  publish = async (noteId, opts) => {
    const publishId = await db.monographs.publish(noteId, opts);
    this.get().refresh();
    notestore.refreshContext();
    return publishId;
  };

  unpublish = async (noteId) => {
    await db.monographs.unpublish(noteId);
    this.get().refresh();
    notestore.refreshContext();
  };
}

const [useStore, store] = createStore(MonographStore);
export { useStore, store };

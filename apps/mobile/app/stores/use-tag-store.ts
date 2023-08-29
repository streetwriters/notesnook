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

import "@notesnook/core/dist/types";
import { groupArray } from "@notesnook/core/dist/utils/grouping";
import create, { State } from "zustand";
import { db } from "../common/database";
import { GroupedItems, Tag } from "@notesnook/core/dist/types";

export interface TagStore extends State {
  tags: GroupedItems<Tag>;
  setTags: (items?: Tag[]) => void;
  clearTags: () => void;
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  setTags: (items) => {
    if (!items) {
      set({
        tags: groupArray(db.tags.all || [], db.settings.getGroupOptions("tags"))
      });
      return;
    }
    const prev = get().tags;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = prev.findIndex((v) => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({ tags: prev });
  },
  clearTags: () => set({ tags: [] })
}));

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

import { Color, Notebook, Tag } from "@notesnook/core/dist/types";
import create, { State } from "zustand";
import { db } from "../common/database";

export interface MenuStore extends State {
  menuPins: (Notebook | Tag)[];
  colorNotes: Color[];
  setMenuPins: () => void;
  setColorNotes: () => void;
  clearAll: () => void;
}

export const useMenuStore = create<MenuStore>((set) => ({
  menuPins: [],
  colorNotes: [],
  setMenuPins: () => {
    db.shortcuts.resolved().then((shortcuts) => {
      set({ menuPins: [...(shortcuts as [])] });
    });
  },
  setColorNotes: () => {
    db.colors?.all.items().then((colors) => {
      set({
        colorNotes: colors
      });
    });
  },
  clearAll: () => set({ menuPins: [], colorNotes: [] })
}));

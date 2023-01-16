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

import create, { State } from "zustand";
import { db } from "../common/database";
import { ColorType } from "../utils/types";

export interface MenuStore extends State {
  menuPins: [];
  colorNotes: ColorType[];
  setMenuPins: () => void;
  setColorNotes: () => void;
  clearAll: () => void;
}

export const useMenuStore = create<MenuStore>((set) => ({
  menuPins: [],
  colorNotes: [],
  setMenuPins: () => {
    try {
      set({ menuPins: [...(db.shortcuts?.resolved as [])] });
    } catch (e) {
      setTimeout(() => {
        try {
          set({ menuPins: [...(db.shortcuts?.resolved as [])] });
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
  },
  setColorNotes: () =>
    set({ colorNotes: (db.colors?.all as ColorType[]) || [] }),
  clearAll: () => set({ menuPins: [], colorNotes: [] })
}));

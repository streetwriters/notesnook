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

import {
  Color,
  Notebook,
  SideBarHideableSection,
  SideBarSection,
  Tag
} from "@notesnook/core";
import create, { State } from "zustand";
import { db } from "../common/database";

export interface MenuStore extends State {
  menuPins: (Notebook | Tag)[];
  colorNotes: Color[];
  setMenuPins: () => void;
  setColorNotes: () => void;
  clearAll: () => void;
  loadingShortcuts: boolean;
  loadingColors: boolean;
  order: Record<SideBarSection, string[]>;
  hiddenItems: Record<SideBarHideableSection, string[]>;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  menuPins: [],
  colorNotes: [],
  loadingShortcuts: true,
  loadingColors: true,
  order: {
    colors: [],
    shortcuts: [],
    routes: []
  },
  hiddenItems: {
    colors: [],
    routes: []
  },
  setMenuPins: () => {
    db.shortcuts.resolved().then((shortcuts) => {
      set({ menuPins: [...(shortcuts as [])], loadingShortcuts: false });
    });
    const sections = ["colors", "shortcuts", "routes"];
    const order: Record<SideBarSection, string[]> = {
      colors: [],
      shortcuts: [],
      routes: []
    };
    const hiddenItems: Record<SideBarHideableSection, string[]> = {
      colors: [],
      routes: []
    };
    for (const section of sections) {
      order[section as SideBarSection] = db.settings.getSideBarOrder(
        section as SideBarSection
      );
      hiddenItems[section as SideBarHideableSection] =
        db.settings.getSideBarHiddenItems(section as SideBarHideableSection);
    }

    if (
      JSON.stringify(get().order || {}) !== JSON.stringify(order || {}) ||
      JSON.stringify(get().hiddenItems || {}) !==
        JSON.stringify(hiddenItems || {})
    ) {
      set({
        order: order,
        hiddenItems: hiddenItems
      });
    }
  },
  setColorNotes: () => {
    db.colors?.all
      .items(undefined, {
        sortBy: "dateCreated",
        sortDirection: "asc"
      })
      .then((colors) => {
        set({
          colorNotes: colors,
          loadingColors: false
        });
      });
  },
  clearAll: () => set({ menuPins: [], colorNotes: [] })
}));

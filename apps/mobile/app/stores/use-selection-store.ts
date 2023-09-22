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

type Item = {
  id: string;
};

export interface SelectionStore extends State {
  selectedItemsList: Array<unknown>;
  selectionMode: boolean;
  setAll: (all: Array<unknown>) => void;
  setSelectionMode: (mode: boolean) => void;
  setSelectedItem: (item: Item) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selectedItemsList: [],
  selectionMode: false,
  setAll: (all) => {
    set({ selectedItemsList: all });
  },
  setSelectionMode: (mode) => {
    set({
      selectionMode: mode,
      selectedItemsList: mode ? get().selectedItemsList : []
    });
  },
  setSelectedItem: (item) => {
    let selectedItems = get().selectedItemsList as Item[];
    const index = selectedItems.findIndex((i) => (i as Item).id === item.id);
    if (index !== -1) {
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(item);
    }
    selectedItems = [...new Set(selectedItems)];

    set({
      selectedItemsList: selectedItems,
      selectionMode: selectedItems.length === 0 ? false : get().selectionMode
    });
  },
  clearSelection: () => {
    set({ selectionMode: false, selectedItemsList: [] });
  }
}));

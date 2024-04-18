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
import BaseStore from "./index";

class SelectionStore extends BaseStore<SelectionStore> {
  selectedItems: string[] = [];
  shouldSelectAll = false;
  isSelectionMode = false;

  toggleSelectionMode = (toggleState?: boolean) => {
    this.set((state) => {
      const isSelectionMode =
        toggleState !== undefined ? toggleState : !state.isSelectionMode;
      state.isSelectionMode = isSelectionMode;
      state.shouldSelectAll = false;
      state.selectedItems = [];
    });
  };

  selectItem = (id: string) => {
    this.set((state) => {
      if (!state.selectedItems.includes(id)) {
        state.selectedItems.push(id);
      }
    });
  };

  deselectItem = (id: string) => {
    this.set((state) => {
      const itemAt = state.selectedItems.indexOf(id);
      if (itemAt >= 0) {
        state.selectedItems.splice(itemAt, 1);
      }
    });

    if (this.get().selectedItems.length <= 0) {
      this.toggleSelectionMode();
    }
  };

  isSelected = (id: string) => {
    return this.get().selectedItems.indexOf(id) > -1;
  };

  setSelectedItems = (ids: string[]) => {
    this.set((state) => (state.selectedItems = ids));
  };

  selectAll = () => {
    if (!this.get().isSelectionMode) return;
    this.set((state) => (state.shouldSelectAll = true));
  };
}

const [useStore, store] = createStore<SelectionStore>(
  (set, get) => new SelectionStore(set, get)
);
export { useStore, store };

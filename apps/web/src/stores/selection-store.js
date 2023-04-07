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

class SelectionStore extends BaseStore {
  selectedItems = [];
  shouldSelectAll = false;
  isSelectionMode = false;

  toggleSelectionMode = (toggleState) => {
    this.set((state) => {
      const isSelectionMode =
        toggleState !== undefined ? toggleState : !state.isSelectionMode;
      state.isSelectionMode = isSelectionMode;
      state.shouldSelectAll = false;
      state.selectedItems = [];
    });
  };

  selectItem = (item) => {
    const index = this.get().selectedItems.findIndex((v) => item.id === v.id);
    this.set((state) => {
      if (index <= -1) {
        state.selectedItems.push(item);
      }
    });
  };

  deselectItem = (item) => {
    this.set((state) => {
      const index = state.selectedItems.findIndex((v) => item.id === v.id);
      if (index >= 0) {
        state.selectedItems.splice(index, 1);
      }
    });

    if (this.get().selectedItems.length <= 0) {
      this.toggleSelectionMode();
    }
  };

  isSelected = (item) => {
    return this.get().selectedItems.indexOf(item) > -1;
  };

  setSelectedItems = (items) => {
    this.set((state) => (state.selectedItems = items));
  };

  selectAll = () => {
    if (!this.get().isSelectionMode) return;
    this.set((state) => (state.shouldSelectAll = true));
  };
}

/**
 * @type {[import("zustand").UseStore<SelectionStore>, SelectionStore]}
 */
const [useStore, store] = createStore(SelectionStore);
export { useStore, store };

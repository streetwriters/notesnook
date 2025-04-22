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
import { Item } from "@notesnook/core";
import create, { State } from "zustand";

export type SelectionState = "intermediate" | "selected" | "deselected";
export type ItemSelection = Record<string, SelectionState | undefined>;
export interface SelectionStore extends State {
  selection: ItemSelection;
  setSelection: (state: ItemSelection) => void;
  multiSelect: boolean;
  toggleMultiSelect: (multiSelect: boolean) => void;
  initialState: ItemSelection;
  canEnableMultiSelectMode: boolean;
  markAs: (item: Item, state: SelectionState | undefined) => void;
  reset: () => void;
  enabled?: boolean;
  getSelectedItemIds: () => string[];
  getDeselectedItemIds: () => string[];
  selectAll?: () => void;
}

export function createItemSelectionStore(
  multiSelectMode = false,
  enabled = true
) {
  return create<SelectionStore>((set, get) => ({
    selection: {},
    setSelection: (state) => {
      set({
        selection: state
      });
    },
    reset: () => {
      set({
        selection: { ...get().initialState }
      });
    },
    enabled: enabled,
    canEnableMultiSelectMode: multiSelectMode,
    initialState: {},
    markAs: (item, state) => {
      set({
        selection: {
          ...get().selection,
          [item.id]:
            state === "deselected"
              ? get().initialState === undefined
                ? undefined
                : "deselected"
              : state
        }
      });
    },
    multiSelect: false,
    toggleMultiSelect: () => {
      if (!get().canEnableMultiSelectMode) return;
      set({
        multiSelect: !get().multiSelect
      });
    },
    getSelectedItemIds: () => {
      const selected: string[] = [];

      if (!get().selection) return selected;

      for (const item in get().selection) {
        if (get().selection[item] === "selected") {
          selected.push(item);
        }
      }
      return selected;
    },
    getDeselectedItemIds: () => {
      const deselected: string[] = [];
      if (!get().selection) return deselected;
      for (const item in get().selection) {
        if (get().selection[item] === "deselected") {
          deselected.push(item);
        }
      }
      return deselected;
    }
  }));
}

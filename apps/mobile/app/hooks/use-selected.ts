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
import { useSelectionStore } from "../stores/use-selection-store";

export default function useIsSelected(item: Item) {
  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const selectedItemsList = useSelectionStore(
    (state) => state.selectedItemsList
  );
  const selected =
    selectionMode &&
    selectedItemsList.findIndex((selectedId) => selectedId === item.id) > -1;

  function toggle() {
    if (useSelectionStore.getState().selectionMode !== item.type) {
      useSelectionStore.getState().setSelectionMode(item.type);
    }
    useSelectionStore.getState().setSelectedItem(item.id);
  }

  return [selected, toggle];
}

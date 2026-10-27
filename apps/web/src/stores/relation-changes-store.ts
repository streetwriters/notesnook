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

import { create } from "zustand";

export type RelationChange = {
  id: string;
  new: boolean;
  op: "add" | "remove";
};

interface IRelationChangesStore {
  selected: RelationChange[];
  isMultiselect: boolean;
  setSelected(refs: RelationChange[]): void;
  setIsMultiselect(state: boolean): void;
}
export const useRelationChangesStore = create<IRelationChangesStore>((set) => ({
  selected: [],
  isMultiselect: false,
  setSelected: (selected) => set({ selected: selected.slice() }),
  setIsMultiselect: (isMultiselect) => set({ isMultiselect })
}));

function createSelection(item: { id: string }): RelationChange {
  return {
    id: item.id,
    op: "add",
    new: true
  };
}
export function findSelectionIndex(
  ref: { id: string },
  array: { id: string }[]
) {
  return array.findIndex((a) => a.id === ref.id);
}

export function selectMultiple(
  topic: { id: string },
  selected: RelationChange[]
) {
  const index = findSelectionIndex(topic, selected);
  const isSelected = index > -1;
  const item = selected[index];

  if (isSelected) {
    // we remove new topics & toggle old ones
    if (item.new) selected.splice(index, 1);
    else item.op = item.op === "add" ? "remove" : "add";
  } else {
    selected.push(createSelection(topic));
  }

  return selected;
}

export function selectSingle(topic: { id: string }, array: RelationChange[]) {
  const selected: RelationChange[] = array.filter((ref) => !ref.new);

  const index = findSelectionIndex(topic, array);
  const item = array[index];
  const isSelected = index > -1;

  if (isSelected && !item.new) {
    item.op = item.op === "add" ? "remove" : "add";
  } else if (!isSelected) {
    selected.forEach((a) => (a.op = "remove"));
    selected.push(createSelection(topic));
  }

  return selected;
}

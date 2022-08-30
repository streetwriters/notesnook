import { groupArray } from "@streetwriters/notesnook-core/utils/grouping";
import create, { State } from "zustand";
import { db } from "../common/database";
import { TrashType } from "../utils/types";

export interface TrashStore extends State {
  trash: Array<TrashType>;
  setTrash: (items?: Array<TrashType>) => void;
  clearTrash: () => void;
}

export const useTrashStore = create<TrashStore>((set, get) => ({
  trash: [],
  setTrash: (items) => {
    if (!items) {
      set({
        trash: groupArray(
          db?.trash?.all || [],
          db.settings?.getGroupOptions("trash")
        )
      });
      return;
    }
    const prev = get().trash;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = prev.findIndex((v) => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({ trash: prev });
  },
  clearTrash: () => set({ trash: [] })
}));

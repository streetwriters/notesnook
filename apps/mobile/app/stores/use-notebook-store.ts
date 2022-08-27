//@ts-ignore
import { groupArray } from "@streetwriters/notesnook-core/utils/grouping";
import create, { State } from "zustand";
import { db } from "../common/database";
import { NotebookType } from "../utils/types";
export interface NotebookStore extends State {
  notebooks: NotebookType[];
  setNotebooks: (items?: NotebookType[]) => void;
  clearNotebooks: () => void;
}

export const useNotebookStore = create<NotebookStore>((set, get) => ({
  notebooks: [],
  setNotebooks: (items) => {
    if (!items) {
      set({
        notebooks: groupArray(
          (db?.notebooks?.all as NotebookType[]) || [],
          db.settings?.getGroupOptions("notebooks")
        )
      });
      return;
    }
    const prev = get().notebooks;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = prev.findIndex((v) => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({ notebooks: prev });
  },
  clearNotebooks: () => set({ notebooks: [] })
}));

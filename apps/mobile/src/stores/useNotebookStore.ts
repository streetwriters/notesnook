//@ts-ignore
import { groupArray } from '@streetwriters/notesnook-core/utils/grouping';
import create, { State } from 'zustand';
import { db } from '../utils/database';
import { NotebookType } from '../utils/types';
export interface NotebookStore extends State {
  notebooks: NotebookType[];
  setNotebooks: (items?: NotebookType[]) => void;
  clearNotebooks: () => void;
}

export const useNotebookStore = create<NotebookStore>((set, get) => ({
  notebooks: [],
  setNotebooks: items => {
    if (!items) {
      set({
        notebooks: groupArray(
          (db?.notebooks?.all as NotebookType[]) || [],
          db.settings?.getGroupOptions('notebooks')
        )
      });
      return;
    }
    let prev = get().notebooks;
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let index = prev.findIndex(v => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({ notebooks: prev });
  },
  clearNotebooks: () => set({ notebooks: [] })
}));

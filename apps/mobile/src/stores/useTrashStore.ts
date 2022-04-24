//@ts-ignore
import { groupArray } from 'notes-core/utils/grouping';
import create, { State } from 'zustand';
import { db } from '../utils/database';
import { NotebookType, NoteType } from '../utils/types';

export interface TrashStore extends State {
  trash: Array<NoteType | NotebookType>;
  setTrash: (items?: Array<NoteType | NotebookType>) => void;
  clearTrash: () => void;
}

export const useTrashStore = create<TrashStore>((set, get) => ({
  trash: [],
  setTrash: items => {
    if (!items) {
      set({
        trash: groupArray(db?.trash?.all || [], db.settings?.getGroupOptions('trash'))
      });
      return;
    }
    let prev = get().trash;
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let index = prev.findIndex(v => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({ trash: prev });
  },
  clearTrash: () => set({ trash: [] })
}));

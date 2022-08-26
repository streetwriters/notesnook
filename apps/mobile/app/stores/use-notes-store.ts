//@ts-ignore
import { groupArray } from "@streetwriters/notesnook-core/utils/grouping";
import create, { State } from "zustand";
import { db } from "../common/database";
import { NoteType } from "../utils/types";

export interface NoteStore extends State {
  notes: NoteType[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setNotes: (items?: NoteType[]) => void;
  clearNotes: () => void;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  loading: true,
  setLoading: (loading) => set({ loading: loading }),

  setNotes: (items) => {
    if (!items) {
      set({
        notes: groupArray(
          (db.notes?.all as NoteType[]) || [],
          db.settings?.getGroupOptions("home")
        )
      });
      return;
    }
    let prev = get().notes;
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let index = prev.findIndex((v) => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({ notes: prev });
  },
  clearNotes: () => set({ notes: [] })
}));

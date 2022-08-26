//@ts-ignore
import { groupArray } from "@streetwriters/notesnook-core/utils/grouping";
import create, { State } from "zustand";
import { db } from "../common/database";
import { NoteType } from "../utils/types";

export interface FavoriteStore extends State {
  favorites: NoteType[];
  setFavorites: (items?: NoteType[]) => void;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  favorites: [],
  setFavorites: (items) => {
    if (!items) {
      set({
        favorites: groupArray(
          db?.notes?.favorites || [],
          db.settings?.getGroupOptions("favorites")
        )
      });
      return;
    }
    let prev = get().favorites;
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let index = prev.findIndex((v) => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({ favorites: prev });
  },
  clearFavorites: () => set({ favorites: [] })
}));

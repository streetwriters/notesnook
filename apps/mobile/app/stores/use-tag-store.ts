//@ts-ignore
import "@notesnook/core/types";
import { groupArray } from "@notesnook/core/utils/grouping";
import create, { State } from "zustand";
import { db } from "../common/database";
import { TagType } from "../utils/types";

export interface TagStore extends State {
  tags: TagType[];
  setTags: (items?: TagType[]) => void;
  clearTags: () => void;
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  setTags: (items) => {
    if (!items) {
      set({
        tags: groupArray(
          (db?.tags?.all as TagType[]) || [],
          db.settings?.getGroupOptions("tags")
        )
      });
      return;
    }
    const prev = get().tags;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = prev.findIndex((v) => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({ tags: prev });
  },
  clearTags: () => set({ tags: [] })
}));

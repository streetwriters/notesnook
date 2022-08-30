import create, { State } from "zustand";
import { db } from "../common/database";
import { ColorType } from "../utils/types";

export interface MenuStore extends State {
  menuPins: [];
  colorNotes: ColorType[];
  setMenuPins: () => void;
  setColorNotes: () => void;
  clearAll: () => void;
}

export const useMenuStore = create<MenuStore>((set) => ({
  menuPins: [],
  colorNotes: [],
  setMenuPins: () => {
    try {
      set({ menuPins: db.settings?.pins || [] });
    } catch (e) {
      setTimeout(() => {
        try {
          set({ menuPins: db.settings?.pins || [] });
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
  },
  setColorNotes: () =>
    set({ colorNotes: (db.colors?.all as ColorType[]) || [] }),
  clearAll: () => set({ menuPins: [], colorNotes: [] })
}));

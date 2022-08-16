//@ts-ignore
import create, { State } from 'zustand';
import { db } from '../common/database';

export interface MenuStore extends State {
  menuPins: object[];
  colorNotes: object[];
  setMenuPins: () => void;
  setColorNotes: () => void;
  clearAll: () => void;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  menuPins: [],
  colorNotes: [],
  setMenuPins: () => {
    try {
      set({ menuPins: db.settings?.pins || [] });
    } catch (e) {
      setTimeout(() => {
        try {
          set({ menuPins: db.settings?.pins || [] });
        } catch (e) {}
      }, 1000);
    }
  },
  //@ts-ignore
  setColorNotes: () => set({ colorNotes: db.colors?.all || [] }),
  clearAll: () => set({ menuPins: [], colorNotes: [] })
}));

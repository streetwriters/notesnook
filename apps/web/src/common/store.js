import { db } from "./index";
import create from "zustand";

const [useStore] = create(set => ({
  init: () => {
    console.log("initializing state...");
    set({
      notebooks: db.notebooks.all
    });
  },
  notebooks: [],
  isSideMenuOpen: false,
  addNotebook: async notebook => {
    if (await db.notebooks.add(notebook)) {
      set({ notebooks: db.notebooks.all });
    }
  }
}));

export default useStore;

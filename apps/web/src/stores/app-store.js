import createStore from "../common/store";
import { db } from "../common";
import { store as noteStore } from "./note-store";
import { store as notebookStore } from "./notebook-store";
import { store as trashStore } from "./trash-store";
import { store as tagStore } from "./tag-store";
import BaseStore from "./index";

class AppStore extends BaseStore {
  // default state
  isSideMenuOpen = false;
  isFocusMode = false;
  colors = [];

  refresh = () => {
    noteStore.refresh();
    notebookStore.refresh();
    trashStore.refresh();
    tagStore.refresh();
    this.refreshColors();
  };

  refreshColors = () => {
    this.set((state) => (state.colors = db.colors.all));
  };

  toggleFocusMode = () => {
    this.set((state) => (state.isFocusMode = !state.isFocusMode));
  };

  toggleSideMenu = () => {
    this.set((state) => (state.isSideMenuOpen = !state.isSideMenuOpen));
  };
}

/**
 * @type {[import("zustand").UseStore<AppStore>, AppStore]}
 */
const [useStore, store] = createStore(AppStore);
export { useStore, store };

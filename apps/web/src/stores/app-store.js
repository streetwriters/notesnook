import createStore from "../common/store";
import { db } from "../common";
import { store as noteStore } from "./note-store";
import { store as notebookStore } from "./notebook-store";
import { store as trashStore } from "./trash-store";
import { store as editorStore } from "./editor-store";
import { store as tagStore } from "./tag-store";
import BaseStore from "./index";

class AppStore extends BaseStore {
  // default state
  isSideMenuOpen = false;
  isFocusMode = false;
  colors = [];

  refresh = async () => {
    noteStore.refresh();
    notebookStore.refresh();
    trashStore.refresh();
    tagStore.refresh();
    await editorStore.openLastSession();
    this.refreshColors();
  };

  refreshColors = () => {
    this.set((state) => (state.colors = db.colors.all));
  };

  toggleFocusMode = () => {
    this.set((state) => (state.isFocusMode = !state.isFocusMode));
  };

  toggleSideMenu = (toggleState) => {
    this.set((state) => (state.isSideMenuOpen = toggleState != null ? toggleState : !state.isSideMenuOpen));
  };
}

/**
 * @type {[import("zustand").UseStore<AppStore>, AppStore]}
 */
const [useStore, store] = createStore(AppStore);
export { useStore, store };

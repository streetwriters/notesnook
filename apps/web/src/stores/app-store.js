import createStore from "../common/store";
import { db } from "../common";
import { store as noteStore } from "./note-store";
import { store as notebookStore } from "./notebook-store";
import { store as trashStore } from "./trash-store";
import BaseStore from "./index";

class AppStore extends BaseStore {
  // default state
  isSideMenuOpen = false;
  isFocusMode = false;
  colors = [];

  refresh = () => {
    noteStore.getState().refresh();
    notebookStore.getState().refresh();
    noteStore.getState().refreshContext();
    trashStore.getState().refresh();
    this.refreshColors();
  };

  refreshColors = () => {
    this.set(state => (state.colors = db.colors.all));
  };

  toggleFocusMode = () => {
    this.set(state => (state.isFocusMode = !state.isFocusMode));
  };

  toggleSideMenu = () => {
    this.set(state => (state.isSideMenuOpen = !state.isSideMenuOpen));
  };
}

const [useStore, store] = createStore(AppStore);

export { useStore, store };

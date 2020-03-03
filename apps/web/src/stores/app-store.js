import createStore from "../common/store";
import { db } from "../common";

function appStore(set) {
  return {
    isSideMenuOpen: false,
    isSelectionMode: false,
    closeSideMenu: function() {
      set(state => (state.isSideMenuOpen = false));
    },
    openSideMenu: function() {
      set(state => (state.isSideMenuOpen = true));
    },
    colors: [],
    refreshColors: function() {
      set(state => {
        state.colors = db.colors.all;
      });
    },
    enterSelectionMode: function() {
      set(state => {
        state.isSelectionMode = true;
      });
    },
    exitSelectionMode: function() {
      set(state => {
        state.isSelectionMode = false;
      });
    }
  };
}

const [useStore, store] = createStore(appStore);

export { useStore, store };
